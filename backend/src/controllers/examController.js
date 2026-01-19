import ExamAttempt from '../models/ExamAttempt.js';
import Exam from '../models/Exam.js';
import Question from '../models/Question.js';   
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { BadRequest, NotFound, Forbidden } from '../core/error.response.js';
import crypto from 'crypto';
import {
    validateExamExists,
    validateExamWithQuestions,
    validateAttemptExists,
    checkExamOwnership,
    checkAttemptOwnership,
    checkSubmittedAttempts,
    checkExistingAttempts,
    checkExamTimeWindow,
    validateTimeRange,
    validateDuration
} from '../utils/examValidation.js';

// ✅ CREATE EXAM (Teacher/Admin only)
export const createExam = async (req, res, next) => {
    try {
        const { title, description, course, questions, duration, startTime, endTime, isProctored } = req.body;
        const teacherId = req.user.id;

        // Validate required fields
        if (!title || !course || !duration) {
            throw new BadRequest('Missing required fields: title, course, duration');
        }

        validateDuration(duration);
        validateTimeRange(startTime, endTime);

        const newExam = new Exam({
            title,
            description,
            course,
            questions: questions || [],
            duration,
            startTime: startTime ? new Date(startTime) : null,
            endTime: endTime ? new Date(endTime) : null,
            isProctored: isProctored !== undefined ? isProctored : true,
            createdBy: teacherId
        });

        await newExam.save();
        return res.status(201).json({ 
            message: 'Exam created successfully', 
            exam: newExam 
        });
    } catch (err) {
        next(err);
    }
};

// ✅ GET ALL EXAMS
export const getExams = async (req, res, next) => {
    try {
        console.log("🔍 Fetching exams for user:", req.user.id, "Role:", req.user.role);
        
        let query = {};

        // ✅ Students only see exams assigned to them
        if (req.user.role === 'user') {
            query = { assignedStudents: req.user.id };
        }
        // ✅ Teachers see their own exams
        else if (req.user.role === 'teacher') {
            query = { createdBy: req.user.id };
        }
        // ✅ Admins see all exams (no filter)

        const exams = await Exam.find(query)
            .populate('course', 'courseTitle name')
            .populate('createdBy', 'username email');

        console.log("✅ Exams found:", exams.length);

        // Pagination
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage) || 10;
        const startIndex = (page - 1) * perPage;
        const endIndex = page * perPage;
        const total = exams.length;

        // Create data for the current page
        const data = exams.slice(startIndex, endIndex);

        return res.status(200).json({ 
            message: 'Exams retrieved successfully', 
            items: data,
            page,
            perPage,
            total
        });
    } catch (err) {
        console.error("❌ Error fetching exams:", err.message);
        console.error("Full error:", err);
        next(err);
    }
};

// ✅ UPDATE EXAM (Teacher/Admin only)
export const updateExam = async (req, res, next) => {
    try {
        const { examId } = req.params;
        const { title, description, questions, duration, startTime, endTime, isProctored } = req.body;

        const exam = await validateExamExists(examId);

        validateDuration(duration);
        validateTimeRange(startTime, endTime);

        await checkSubmittedAttempts(examId);

        // Update exam fields
        if (title) exam.title = title;
        if (description) exam.description = description;
        if (questions) exam.questions = questions;
        if (duration) exam.duration = duration;
        if (startTime) exam.startTime = new Date(startTime);
        if (endTime) exam.endTime = new Date(endTime);
        if (isProctored !== undefined) exam.isProctored = isProctored;

        await exam.save();

        return res.status(200).json({ 
            message: 'Exam updated successfully', 
            exam 
        });
    } catch (err) {
        next(err);
    }
};

// ✅ DELETE EXAM (Teacher/Admin only)
export const deleteExam = async (req, res, next) => {
    try {
        const { examId } = req.params;

        const exam = await Exam.findById(examId);
        if (!exam) {
            throw new NotFound('Exam not found');
        }

        // Check if there are any attempts
        const attempts = await ExamAttempt.countDocuments({ exam: examId });
        if (attempts > 0) {
            throw new BadRequest('Cannot delete exam - there are existing student attempts. Attempt count: ' + attempts);
        }

        const deletedExam = await Exam.findByIdAndDelete(examId);

        return res.status(200).json({ 
            message: 'Exam deleted successfully',
            data: { id: deletedExam._id }
        });
    } catch (err) {
        console.error('Error deleting exam:', err);
        next(err);
    }
};

// ✅ GET EXAM DETAILS (Student view - no answer keys)
export const getExamDetail = async (req, res, next) => {
    try {
        const { id } = req.params;
        const now = new Date();

        const exam = await validateExamWithQuestions(id);
        checkExamTimeWindow(exam, now);

        // Check if student already has an active attempt
        const existingAttempt = await ExamAttempt.findOne({
            exam: id,
            student: req.user.id,
            submittedAt: null
        });

        if (existingAttempt) {
            throw new BadRequest('You already have an active attempt for this exam');
        }

        return res.status(200).json({ 
            message: 'Exam details retrieved', 
            exam 
        });
    } catch (err) {
        next(err);
    }
};

// ✅ START EXAM (Create exam attempt)
export const startExam = async (req, res) => {
    try {
        const { examId } = req.body;
        const studentId = req.user.id;
        const now = new Date();

        const exam = await Exam.findById(examId);
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // Validate time window
        if (exam.startTime && exam.startTime > now) {
            return res.status(403).json({ message: 'Exam has not started yet' });
        }

        if (exam.endTime && exam.endTime < now) {
            return res.status(403).json({ message: 'Exam has ended' });
        }

        // Check if student already has an active attempt
        const existingAttempt = await ExamAttempt.findOne({
            exam: examId,
            student: studentId,
            submittedAt: null
        });

        if (existingAttempt) {
            return res.status(400).json({ 
                message: 'You already have an active attempt for this exam',
                attemptId: existingAttempt._id 
            });
        }

        // ✅ Generate secure attempt token
        const attemptToken = crypto.randomBytes(32).toString('hex');

        // Create new exam attempt
        const newAttempt = new ExamAttempt({
            student: studentId,
            exam: examId,
            attemptToken: attemptToken,
            answers: [],
            startedAt: now,
            aiLogs: {
                faceMissingDuration: 0,
                emotionStats: {},
                suspiciousActions: 0
            }
        });

        await newAttempt.save();

        return res.status(201).json({ 
            message: 'Exam started successfully',
            attemptId: newAttempt._id,
            attemptToken: attemptToken,  // ✅ Send secure token
            timeLimit: exam.duration,
            startedAt: newAttempt.startedAt
        });
    } catch (err) {
        console.error('Error starting exam:', err);
        return res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// ✅ SUBMIT EXAM (Calculate score & save attempt)
export const submitExam = async (req, res, next) => {
    try {
        const { attemptId, attemptToken, answers, aiLogs } = req.body;
        const studentId = req.user.id;

        if (!attemptId || !attemptToken || !answers) {
            throw new BadRequest('Missing attemptId, attemptToken or answers');
        }

        const attempt = await validateAttemptExists(attemptId);
        
        // ✅ Verify security token matches
        if (attempt.attemptToken !== attemptToken) {
            throw new Forbidden('Invalid attempt token - security verification failed');
        }

        // Verify it belongs to the student
        if (attempt.student.toString() !== studentId) {
            throw new Forbidden('This attempt does not belong to you');
        }

        // Verify attempt hasn't already been submitted
        if (attempt.submittedAt) {
            throw new BadRequest('This exam has already been submitted');
        }

        // Get exam details
        const exam = await Exam.findById(attempt.exam);
        const now = new Date();

        // Check if still within time limit
        const timeElapsed = (now - attempt.startedAt) / (1000 * 60);
        if (timeElapsed > exam.duration) {
            throw new BadRequest(`Submission time exceeded - elapsed: ${Math.round(timeElapsed)}min, limit: ${exam.duration}min`);
        }

        // Calculate score
        const score = await calculateExamScore(answers, attempt.exam);

        // Check proctoring violations
        const proctor_flags = checkProctoringSuspicion(aiLogs || {}, exam.isProctored);

        // Update attempt with final data
        attempt.answers = answers;
        attempt.score = score.totalScore;
        attempt.isPassed = score.totalScore >= 50;
        attempt.submittedAt = now;
        attempt.aiLogs = {
            faceMissingDuration: aiLogs?.faceMissingDuration || 0,
            emotionStats: aiLogs?.emotionStats || {},
            suspiciousActions: proctor_flags.suspiciousCount
        };

        await attempt.save();

        return res.status(200).json({ 
            message: 'Exam submitted successfully',
            score: score.totalScore,
            isPassed: attempt.isPassed,
            correctAnswers: score.correctCount,
            totalQuestions: score.totalQuestions,
            proctor_warnings: proctor_flags.warnings,
            timeElapsed: Math.round(timeElapsed)
        });
    } catch (err) {
        next(err);
    }
};

// ✅ GET EXAM HISTORY (Teacher view - all attempts for an exam)
export const getExamHistory = async (req, res, next) => {
    try {
        const { examId } = req.params;
        const exam = await validateExamExists(examId);
        
        await checkExamOwnership(exam, req.user.id, req.user.role);

        // Get all attempts for this exam
        const attempts = await ExamAttempt.find({ exam: examId })
            .populate('student', 'username email firstName lastName')
            .select('-answers')
            .sort({ submittedAt: -1 });

        // Calculate statistics
        const stats = {
            totalAttempts: attempts.length,
            averageScore: attempts.length > 0 ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length) : 0,
            passCount: attempts.filter(a => a.isPassed).length,
            failCount: attempts.filter(a => !a.isPassed).length,
            passRate: attempts.length > 0 ? Math.round((attempts.filter(a => a.isPassed).length / attempts.length) * 100) : 0
        };

        return res.status(200).json({ 
            message: 'Exam history retrieved',
            exam: { title: exam.title, duration: exam.duration },
            stats,
            attempts
        });
    } catch (err) {
        next(err);
    }
};

// ✅ GET STUDENT ATTEMPT DETAILS
export const getAttemptById = async (req, res, next) => {
    try {
        const { attemptId } = req.params;
        const userId = req.user.id;

        const attempt = await validateAttemptExists(attemptId);
        attempt.populate('student', 'username email');
        attempt.populate('exam', 'title duration');
        attempt.populate('answers.questionId');

        await checkAttemptOwnership(attempt, userId, req.user.role);

        return res.status(200).json({ 
            message: 'Attempt details retrieved',
            attempt
        });
    } catch (err) {
        next(err);
    }
};

// ✅ HELPER: Calculate exam score
export const calculateExamScore = async (answers, examId) => {
    try {
        const exam = await Exam.findById(examId).populate('questions');
        
        if (!exam || !exam.questions) {
            return { totalScore: 0, correctCount: 0, totalQuestions: 0 };
        }

        let correctCount = 0;
        const totalQuestions = exam.questions.length;

        // Compare each answer with correct option
        answers.forEach(answer => {
            const question = exam.questions.find(q => q._id.toString() === answer.questionId.toString());
            if (question && question.correctOption === answer.selectedOption) {
                correctCount++;
            }
        });

        // Calculate percentage score
        const totalScore = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

        return {
            totalScore,
            correctCount,
            totalQuestions
        };
    } catch (err) {
        console.error('Error calculating score:', err);
        return { totalScore: 0, correctCount: 0, totalQuestions: 0 };
    }
};

// ✅ HELPER: Check proctoring suspicions
export const checkProctoringSuspicion = (aiLogs, isProctored) => {
    const warnings = [];
    let suspiciousCount = 0;

    if (!isProctored) {
        return { warnings, suspiciousCount: 0 };
    }

    // Face missing threshold (5 minutes)
    if (aiLogs.faceMissingDuration && aiLogs.faceMissingDuration > 300) {
        warnings.push(`Face not detected for ${Math.round(aiLogs.faceMissingDuration / 60)} minutes`);
        suspiciousCount += 2;
    }

    // Suspicious emotion (Fear, Anger, Disgust)
    if (aiLogs.emotionStats) {
        const suspiciousEmotions = ['fear', 'anger', 'disgust'];
        suspiciousEmotions.forEach(emotion => {
            if (aiLogs.emotionStats[emotion]) {
                warnings.push(`Suspicious emotion detected: ${emotion}`);
                suspiciousCount += 1;
            }
        });
    }

    // Tab switch threshold (more than 3 times)
    if (aiLogs.tabSwitchCount && aiLogs.tabSwitchCount > 3) {
        warnings.push(`Tab switched ${aiLogs.tabSwitchCount} times`);
        suspiciousCount += 1;
    }

    return { warnings, suspiciousCount };
};

// ✅ ASSIGN EXAM TO STUDENTS (Teacher/Admin only)
export const assignExamToStudents = async (req, res, next) => {
    try {
        const { examId } = req.params;
        const { studentIds } = req.body;
        const teacherId = req.user.id;

        // Validate input
        if (!Array.isArray(studentIds) || studentIds.length === 0) {
            throw new BadRequest('studentIds must be a non-empty array');
        }

        // Verify exam exists and teacher owns it
        const exam = await Exam.findById(examId);
        if (!exam) {
            throw new NotFound('Exam not found');
        }

        // Check if teacher is creator or admin
        if (exam.createdBy.toString() !== teacherId && req.user.role !== 'admin') {
            throw new Forbidden('You do not have permission to assign this exam');
        }

        // Validate all students exist
        const students = await User.find({ _id: { $in: studentIds }, role: 'user' });
        if (students.length !== studentIds.length) {
            throw new BadRequest('Some students not found or invalid role');
        }

        // Add students to assignedStudents (avoid duplicates)
        const newAssignedStudents = [...new Set([
            ...exam.assignedStudents.map(id => id.toString()),
            ...studentIds
        ])];

        exam.assignedStudents = newAssignedStudents;
        await exam.save();

        // Send notifications to all assigned students
        const notifications = studentIds.map(studentId => ({
            recipient: studentId,
            type: 'exam_assigned',
            title: `New Exam Assigned: ${exam.title}`,
            message: `You have been assigned to take the exam "${exam.title}". Duration: ${exam.duration} minutes.`,
            relatedEntity: examId,
            entityType: 'Exam',
            createdBy: teacherId
        }));

        await Notification.insertMany(notifications);

        return res.status(200).json({
            message: `Exam assigned to ${studentIds.length} student(s) successfully`,
            exam,
            notificationsSent: studentIds.length
        });
    } catch (err) {
        next(err);
    }
};

// ✅ GET ASSIGNED EXAMS (Students view - only their assigned exams)
export const getAssignedExams = async (req, res, next) => {
    try {
        const studentId = req.user.id;

        const exams = await Exam.find({ assignedStudents: studentId })
            .populate('course', 'courseTitle name')
            .populate('createdBy', 'username email');

        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage) || 10;
        const startIndex = (page - 1) * perPage;
        const endIndex = page * perPage;
        const total = exams.length;

        const data = exams.slice(startIndex, endIndex);

        return res.status(200).json({
            message: 'Assigned exams retrieved successfully',
            items: data,
            page,
            perPage,
            total
        });
    } catch (err) {
        next(err);
    }
};

// ✅ GET EXAM RESULTS (Teacher/Admin - see all students' attempts)
export const getExamResults = async (req, res, next) => {
    try {
        const { examId } = req.params;
        const teacherId = req.user.id;

        // Verify exam exists
        const exam = await Exam.findById(examId);
        if (!exam) {
            throw new NotFound('Exam not found');
        }

        // Check if teacher owns exam or is admin
        if (exam.createdBy.toString() !== teacherId && req.user.role !== 'admin') {
            throw new Forbidden('You do not have permission to view these results');
        }

        // Get all attempts for this exam
        const attempts = await ExamAttempt.find({ exam: examId })
            .populate('student', 'username email')
            .sort({ submittedAt: -1 });

        const resultsWithStats = attempts.map(attempt => ({
            _id: attempt._id,
            studentName: attempt.student?.username,
            studentEmail: attempt.student?.email,
            score: attempt.score,
            isPassed: attempt.isPassed,
            startedAt: attempt.startedAt,
            submittedAt: attempt.submittedAt,
            duration: attempt.submittedAt ? Math.round((attempt.submittedAt - attempt.startedAt) / 60000) : 0, // minutes
            aiLogs: {
                faceMissingDuration: attempt.aiLogs?.faceMissingDuration || 0,
                emotionStats: attempt.aiLogs?.emotionStats || {},
                suspiciousActions: attempt.aiLogs?.suspiciousActions || 0
            }
        }));

        return res.status(200).json({
            message: 'Exam results retrieved successfully',
            examTitle: exam.title,
            totalAttempts: resultsWithStats.length,
            results: resultsWithStats
        });
    } catch (err) {
        next(err);
    }
};

// ✅ GET USER NOTIFICATIONS
export const getUserNotifications = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const notifications = await Notification.find({ recipient: userId })
            .populate('relatedEntity')
            .sort({ createdAt: -1 });

        const unreadCount = notifications.filter(n => !n.isRead).length;

        return res.status(200).json({
            message: 'Notifications retrieved successfully',
            unreadCount,
            notifications
        });
    } catch (err) {
        next(err);
    }
};

// ✅ MARK NOTIFICATION AS READ
export const markNotificationAsRead = async (req, res, next) => {
    try {
        const { notificationId } = req.params;

        const notification = await Notification.findByIdAndUpdate(
            notificationId,
            { isRead: true, readAt: new Date() },
            { new: true }
        );

        if (!notification) {
            throw new NotFound('Notification not found');
        }

        return res.status(200).json({
            message: 'Notification marked as read',
            notification
        });
    } catch (err) {
        next(err);
    }
};