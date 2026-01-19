import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import axios from 'axios';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import Typography from '@mui/material/Typography';
import success from '../assets/success.png';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
    const [expandedCourses, setExpandedCourses] = useState([]);
    const [expandedExams, setExpandedExams] = useState([]);
    const { user, accessToken } = useAuth(); 
    const [popup, setPopup] = useState(false);
    const [courses, setCourses] = useState([]);
    const [exams, setExams] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch courses
                const courseResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/courses/all`, { 
                    withCredentials: true,
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
                if (courseResponse.status === 200) {
                    setCourses(courseResponse.data.items || courseResponse.data.courses || courseResponse.data || []);
                }

                // Fetch exams
                const examResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/exams`, { 
                    withCredentials: true,
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
                if (examResponse.status === 200) {
                    setExams(examResponse.data.items || examResponse.data.exams || []);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                console.error('Error response:', error.response?.data);
                if (error.response?.status === 401) {
                    localStorage.removeItem('accessToken');
                    window.location.href = '/login';
                }
            }
        };
        
        if (user && accessToken) {
            fetchData();
        }
    }, [user, accessToken]);

    const toggleQuizVisibility = (courseId) => {
        if (expandedCourses.includes(courseId)) {
            setExpandedCourses(expandedCourses.filter(id => id !== courseId));
        } else {
            setExpandedCourses([...expandedCourses, courseId]);
        }
    };

    const toggleExamVisibility = (courseId) => {
        if (expandedExams.includes(courseId)) {
            setExpandedExams(expandedExams.filter(id => id !== courseId));
        } else {
            setExpandedExams([...expandedExams, courseId]);
        }
    };

    const handleQuizClick = (courseTitle, quiz, quizTitle) => {
        const quizId = typeof quiz === 'object' ? quiz._id : quiz;
        
        const quizData = {
            courseTitle,
            quizId: quizId, 
            quizTitle: typeof quiz === 'object' ? quiz.title : quizTitle
        };
        
        console.log('Storing quiz data:', quizData); 
        localStorage.setItem('currentQuiz', JSON.stringify(quizData));
    };

    // Group exams by course
    const getExamsForCourse = (courseId) => {
        return exams.filter(exam => {
            const examCourseId = typeof exam.course === 'object' ? exam.course._id : exam.course;
            return examCourseId === courseId;
        });
    };

    const isExamAvailable = (exam) => {
        const now = new Date();
        if (exam.startTime && new Date(exam.startTime) > now) return false;
        if (exam.endTime && new Date(exam.endTime) < now) return false;
        return true;
    };

    const getExamStatus = (exam) => {
        const now = new Date();
        if (exam.startTime && new Date(exam.startTime) > now) {
            return { text: 'Not Started', color: '#999' };
        }
        if (exam.endTime && new Date(exam.endTime) < now) {
            return { text: 'Ended', color: '#e74c3c' };
        }
        return { text: 'Active', color: '#27ae60' };
    };

    if (!user) {
        return <Navigate to="/login" />;
    }

    return (
        <section id="dashboard" className="w-full min-h-[calc(100vh-72px)] py-14 px-10">

            {popup && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
                    <div className="bg-white p-10 rounded-lg">
                        <img
                            className="justify-center items-center mx-auto"
                            style={{ width: "200px", height: "200px" }}
                            alt="Success Icon"
                            src={success}
                        />
                        <Typography variant="h5" component="h2" gutterBottom>
                            Email was sent successfully!
                        </Typography>
                        <div className="flex justify-center items-center mt-2">
                            <button 
                                className="w-20 h-10 bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded-md" 
                                onClick={() => setPopup(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
                {courses.map(course => {
                    const courseExams = getExamsForCourse(course._id);
                    const hasQuizzes = course.quiz && course.quiz.length > 0;
                    const hasExams = courseExams.length > 0;
                    
                    return (
                        <div
                            key={course._id}
                            className="course-card"
                        >
                            {course.image && (
                                <img src={course.image} alt={course.courseTitle} className="course-image" />
                            )}
                            <div className="p-6">
                                <h2 className="course-title">{course.courseTitle}</h2>
                                <div className="flex justify-between items-center mb-4">
                                    <p className="course-description">{course.description}</p>
                                    <span className="course-level">{course.level}</span>
                                </div>

                                {/* QUIZZES SECTION */}
                                {hasQuizzes && (
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-semibold text-blue-600">📚 Quizzes</h3>
                                        </div>
                                        {expandedCourses.includes(course._id) ? (
                                            <div>
                                                <ul className="quiz-list">
                                                    {course.quiz?.map((quiz, index) => {
                                                        const quizId = typeof quiz === 'object' ? quiz._id : quiz;
                                                        const quizTitle = typeof quiz === 'object' ? quiz.title : `Quiz ${index + 1}`;
                                                        
                                                        return (
                                                            <li 
                                                                key={`${course._id}-${quizId}-${index}`}
                                                                className="quiz-item"
                                                            >
                                                                <Link
                                                                    to={`/quiz/${encodeURIComponent(course.courseTitle)}/${quizId}`}
                                                                    className="quiz-link"
                                                                    onClick={() => handleQuizClick(course.courseTitle, quiz, quizTitle)}
                                                                >
                                                                    {quizTitle}
                                                                </Link>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                                <button 
                                                    onClick={() => toggleQuizVisibility(course._id)} 
                                                    className="toggle-btn"
                                                >
                                                    Hide Quizzes <ArrowDropUpIcon />
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => toggleQuizVisibility(course._id)} 
                                                className="toggle-btn"
                                            >
                                                Show Quizzes <ArrowDropDownIcon />
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* EXAMS SECTION */}
                                {hasExams && (
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h3 className="font-semibold text-red-600">📝 Exams</h3>
                                        </div>
                                        {expandedExams.includes(course._id) ? (
                                            <div>
                                                <ul className="space-y-2">
                                                    {courseExams.map((exam) => {
                                                        const status = getExamStatus(exam);
                                                        const available = isExamAvailable(exam);
                                                        
                                                        return (
                                                            <li 
                                                                key={exam._id}
                                                                className="border border-gray-200 rounded p-3 hover:bg-gray-50"
                                                            >
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div className="flex-1">
                                                                        <h4 className="font-semibold">{exam.title}</h4>
                                                                        <p className="text-sm text-gray-600">{exam.description}</p>
                                                                    </div>
                                                                    <span 
                                                                        className="text-xs px-2 py-1 rounded"
                                                                        style={{ backgroundColor: status.color + '20', color: status.color }}
                                                                    >
                                                                        {status.text}
                                                                    </span>
                                                                </div>
                                                                <div className="text-xs text-gray-500 mb-2">
                                                                    <div>⏱️ Duration: {exam.duration} minutes</div>
                                                                    <div>📷 Camera: {exam.isProctored ? 'Required' : 'Not Required'}</div>
                                                                    {exam.startTime && (
                                                                        <div>📅 Starts: {new Date(exam.startTime).toLocaleString()}</div>
                                                                    )}
                                                                    {exam.endTime && (
                                                                        <div>📅 Ends: {new Date(exam.endTime).toLocaleString()}</div>
                                                                    )}
                                                                </div>
                                                                <Link
                                                                    to={`/exam/${exam._id}`}
                                                                    className={`inline-block text-center w-full py-2 px-4 rounded font-semibold transition-colors ${
                                                                        available 
                                                                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                                                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                                    }`}
                                                                    onClick={(e) => !available && e.preventDefault()}
                                                                >
                                                                    {available ? 'Start Exam' : 'Not Available'}
                                                                </Link>
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                                <button 
                                                    onClick={() => toggleExamVisibility(course._id)} 
                                                    className="toggle-btn mt-2"
                                                >
                                                    Hide Exams <ArrowDropUpIcon />
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => toggleExamVisibility(course._id)} 
                                                className="toggle-btn"
                                            >
                                                Show Exams ({courseExams.length}) <ArrowDropDownIcon />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};

export default Dashboard;