import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import CircularProgress from '@mui/material/CircularProgress';
import { HiX, HiCheck } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import { useExamMonitoring } from '../hooks/useExamMonitoring';
import Swal from 'sweetalert2';

const ExamPage = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [exam, setExam] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [shuffledOptions, setShuffledOptions] = useState({});
    const [answers, setAnswers] = useState({});
    const [timeRemaining, setTimeRemaining] = useState(0); // in seconds
    const [attemptId, setAttemptId] = useState(null);
    const [attemptToken, setAttemptToken] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [examStarted, setExamStarted] = useState(false);
    const [startTime, setStartTime] = useState(null);
    
    const timerIntervalRef = useRef(null);
    
    const {
        videoRef,
        isCameraReady,
        isMonitoring,
        error: cameraError,
        status: monitoringStatus,
        initializeCamera,
        startMonitoring,
        stopMonitoring,
        getLogs
    } = useExamMonitoring();

    const loggedIn = !!user;

    // Fetch exam details
    useEffect(() => {
        const fetchExam = async () => {
            if (!examId) {
                setLoading(false);
                return;
            }

            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/api/exams/${examId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                        },
                        withCredentials: true
                    }
                );

                if (response.status === 200) {
                    const examData = response.data.exam;
                    setExam(examData);
                    
                    // Questions should be populated from backend
                    if (examData.questions && examData.questions.length > 0) {
                        // Check if questions are already populated (objects) or just IDs (strings)
                        if (typeof examData.questions[0] === 'object' && examData.questions[0].question) {
                            // Already populated
                            setQuestions(examData.questions);
                        } else {
                            // Need to fetch questions individually
                            try {
                                const questionPromises = examData.questions.map(qId =>
                                    axios.get(
                                        `${import.meta.env.VITE_API_URL}/api/question/${qId}`,
                                        {
                                            headers: {
                                                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                                            },
                                            withCredentials: true
                                        }
                                    )
                                );
                                
                                const questionResponses = await Promise.all(questionPromises);
                                const questionData = questionResponses.map(res => res.data.question || res.data);
                                setQuestions(questionData);
                                
                                // Shuffle options once when questions load
                                const shuffled = {};
                                questionData.forEach(question => {
                                    const allOptions = question.incorrectOptions 
                                        ? [...question.incorrectOptions, question.correctOption]
                                        : [question.correctOption];
                                    shuffled[question._id] = [...allOptions].sort(() => Math.random() - 0.5);
                                });
                                setShuffledOptions(shuffled);
                            } catch (err) {
                                console.error('Error fetching questions:', err);
                                // Try to continue with empty questions array
                                setQuestions([]);
                            }
                        }
                    } else {
                        setQuestions([]);
                    }
                    
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error fetching exam:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.response?.data?.message || 'Failed to load exam'
                }).then(() => {
                    navigate(-1);
                });
                setLoading(false);
            }
        };

        fetchExam();
    }, [examId, navigate]);

    // Auto-initialize camera for proctored exams when page loads
    useEffect(() => {
        if (exam && exam.isProctored && !examStarted && !isCameraReady && !cameraError && videoRef.current) {
            console.log('🎥 Auto-initializing camera for proctored exam...');
            initializeCamera();
        }
    }, [exam, examStarted, isCameraReady, cameraError, initializeCamera, videoRef]);

    // Start exam attempt
    const startExamAttempt = async () => {
        try {
            // Initialize camera first if not already done
            if (exam.isProctored && !isCameraReady) {
                await initializeCamera();
            }
            
            // Start exam attempt
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/exams/start`,
                { examId },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    },
                    withCredentials: true
                }
            );

            if (response.status === 201) {
                const { attemptId, attemptToken, timeLimit, startedAt } = response.data;
                setAttemptId(attemptId);
                setAttemptToken(attemptToken);
                setTimeRemaining(timeLimit * 60); // Convert minutes to seconds
                setStartTime(new Date(startedAt));
                setExamStarted(true);
                
                // Start monitoring
                startMonitoring();
                
                // Start timer
                startTimer(timeLimit * 60);
            }
        } catch (error) {
            console.error('Error starting exam:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || 'Failed to start exam'
            });
        }
    };

    // Timer countdown
    const startTimer = (initialSeconds) => {
        setTimeRemaining(initialSeconds);
        
        timerIntervalRef.current = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(timerIntervalRef.current);
                    handleTimeUp();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // Handle time up
    const handleTimeUp = () => {
        Swal.fire({
            icon: 'warning',
            title: 'Time Up!',
            text: 'Your exam time has expired. Submitting your answers...',
            allowOutsideClick: false,
            allowEscapeKey: false
        });
        submitExam(true);
    };

    // Format time display
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Handle answer selection
    const handleAnswerChange = (questionId, selectedOption) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: selectedOption
        }));
    };

    // Submit exam
    const submitExam = async (timeUp = false) => {
        if (submitting) return;

        // Check if all questions answered
        if (!timeUp && questions.length > 0) {
            const unansweredCount = questions.filter(q => !answers[q._id]).length;
            if (unansweredCount > 0) {
                const result = await Swal.fire({
                    icon: 'warning',
                    title: 'Unanswered Questions',
                    text: `You have ${unansweredCount} unanswered question(s). Are you sure you want to submit?`,
                    showCancelButton: true,
                    confirmButtonText: 'Yes, Submit',
                    cancelButtonText: 'No, Continue'
                });
                
                if (!result.isConfirmed) {
                    return;
                }
            }
        }

        setSubmitting(true);
        stopMonitoring();

        try {
            // Get AI logs
            const aiLogs = getLogs();
            
            // Format answers for submission
            const formattedAnswers = Object.entries(answers).map(([questionId, selectedOption]) => ({
                questionId,
                selectedOption
            }));

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/exams/submit`,
                {
                    attemptId,
                    attemptToken,
                    answers: formattedAnswers,
                    aiLogs: {
                        faceMissingDuration: aiLogs?.faceMissingDuration || 0,
                        emotionStats: aiLogs?.emotionStats || {}
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    },
                    withCredentials: true
                }
            );

            if (response.status === 200) {
                const { score, isPassed, correctAnswers, totalQuestions, proctor_warnings } = response.data;
                
                await Swal.fire({
                    icon: isPassed ? 'success' : 'info',
                    title: 'Exam Submitted',
                    html: `
                        <div class="text-left">
                            <p><strong>Score:</strong> ${score}%</p>
                            <p><strong>Correct Answers:</strong> ${correctAnswers}/${totalQuestions}</p>
                            <p><strong>Status:</strong> ${isPassed ? 'Passed ✓' : 'Failed ✗'}</p>
                            ${proctor_warnings && proctor_warnings.length > 0 ? 
                                `<p><strong>Warnings:</strong> ${proctor_warnings.join(', ')}</p>` : ''}
                        </div>
                    `,
                    confirmButtonText: 'OK'
                });

                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Error submitting exam:', error);
            Swal.fire({
                icon: 'error',
                title: 'Submission Error',
                text: error.response?.data?.message || 'Failed to submit exam'
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
            stopMonitoring();
        };
    }, [stopMonitoring]);

    if (!loggedIn) {
        return <Navigate to="/login" />;
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <CircularProgress />
            </div>
        );
    }

    if (!exam) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <p className="text-xl mb-4">Exam not found</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 bg-blue-500 text-white rounded"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    // Pre-exam screen (camera setup)
    if (!examStarted) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                        <h1 className="text-2xl font-bold mb-4">{exam.title}</h1>
                        {exam.description && (
                            <p className="text-gray-600 dark:text-gray-300 mb-4">{exam.description}</p>
                        )}
                        
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold mb-2">Exam Details:</h2>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Duration: {exam.duration} minutes</li>
                                <li>Questions: {questions.length}</li>
                                <li>Proctored: {exam.isProctored ? 'Yes (Camera Required)' : 'No'}</li>
                            </ul>
                        </div>

                        {exam.isProctored && (
                            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                <h3 className="font-semibold mb-2">⚠️ Camera Requirements:</h3>
                                <ul className="list-disc list-inside space-y-1 text-sm">
                                    <li>You must enable camera access to take this exam</li>
                                    <li>Your face must be visible throughout the exam</li>
                                    <li>AI monitoring will track your presence and emotions</li>
                                    <li>Leaving the camera view may result in warnings</li>
                                </ul>
                            </div>
                        )}

                        {cameraError && (
                            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <p className="text-red-600 dark:text-red-400">{cameraError}</p>
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                onClick={startExamAttempt}
                                disabled={exam.isProctored && !isCameraReady && !cameraError}
                                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {exam.isProctored && !isCameraReady && !cameraError 
                                    ? 'Initializing Camera...' 
                                    : 'Start Exam'}
                            </button>
                            <button
                                onClick={() => navigate(-1)}
                                className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Exam in progress
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header with timer and camera */}
            <div className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                Swal.fire({
                                    icon: 'warning',
                                    title: 'Leave Exam?',
                                    text: 'Are you sure you want to leave? Your progress will be saved but you cannot return.',
                                    showCancelButton: true,
                                    confirmButtonText: 'Yes, Leave',
                                    cancelButtonText: 'Cancel'
                                }).then(result => {
                                    if (result.isConfirmed) {
                                        stopMonitoring();
                                        navigate('/dashboard');
                                    }
                                });
                            }}
                            className="text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                        >
                            <HiX className="w-6 h-6" />
                        </button>
                        
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold">Time Remaining:</span>
                            <span className={`text-2xl font-bold ${timeRemaining < 300 ? 'text-red-600' : 'text-gray-800 dark:text-white'}`}>
                                {formatTime(timeRemaining)}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Camera Preview */}
                        {exam.isProctored && (
                            <div className="relative">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="w-32 h-24 rounded border-2 border-gray-300 dark:border-gray-600 object-cover"
                                />
                                <div className="absolute -bottom-6 left-0 right-0 text-xs text-center">
                                    <div className={`px-2 py-1 rounded ${
                                        monitoringStatus.status === 'face_missing' || monitoringStatus.status === 'critical_warning'
                                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                            : monitoringStatus.status === 'monitoring'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                    }`}>
                                        {monitoringStatus.message || 'Monitoring'}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* Warning banner */}
                {monitoringStatus.status === 'face_missing' || monitoringStatus.status === 'critical_warning' ? (
                    <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded">
                        <p className="text-red-800 dark:text-red-200 font-semibold">
                            ⚠️ {monitoringStatus.message}
                        </p>
                    </div>
                ) : null}

                {/* Questions */}
                <div className="space-y-6">
                    {questions.map((question, index) => (
                        <div
                            key={question._id}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
                        >
                            <div className="flex items-start gap-3 mb-4">
                                <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                                    Question {index + 1}:
                                </span>
                                <p className="flex-1 text-gray-800 dark:text-gray-200">
                                    {question.question}
                                </p>
                            </div>

                            <div className="space-y-2 ml-8">
                                {(() => {
                                    // Get pre-shuffled options for this question
                                    const shuffled = shuffledOptions[question._id] || [question.correctOption];
                                    const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'].slice(0, shuffled.length);
                                    
                                    return shuffled.map((optionValue, index) => {
                                        const optionLabel = optionLabels[index];
                                        return (
                                            <label
                                                key={index}
                                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border-2 transition-colors ${
                                                    answers[question._id] === optionValue
                                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name={`question-${question._id}`}
                                                    value={optionValue}
                                                    checked={answers[question._id] === optionValue}
                                                    onChange={() => handleAnswerChange(question._id, optionValue)}
                                                    className="w-5 h-5 text-blue-600"
                                                />
                                                <span className="font-semibold text-gray-700 dark:text-gray-300">
                                                    {optionLabel}:
                                                </span>
                                                <span className="text-gray-600 dark:text-gray-400">
                                                    {optionValue}
                                                </span>
                                            </label>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Submit button */}
                <div className="mt-8 flex justify-center">
                    <button
                        onClick={() => submitExam(false)}
                        disabled={submitting || timeRemaining === 0}
                        className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-lg font-semibold flex items-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <CircularProgress size={20} className="text-white" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                <HiCheck className="w-5 h-5" />
                                Submit Exam
                            </>
                        )}
                    </button>
                </div>

                {/* Progress indicator */}
                <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
                    Answered: {Object.keys(answers).length} / {questions.length}
                </div>
            </div>
        </div>
    );
};

export default ExamPage;
