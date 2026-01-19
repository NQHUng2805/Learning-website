import Exam from '../models/Exam.js';
import ExamAttempt from '../models/ExamAttempt.js';
import { NotFound, BadRequest, Forbidden } from '../core/error.response.js';

// ✅ HELPER: Validate exam exists
export const validateExamExists = async (examId) => {
    const exam = await Exam.findById(examId);
    if (!exam) {
        throw new NotFound('Exam not found');
    }
    return exam;
};

// ✅ HELPER: Validate exam with questions
export const validateExamWithQuestions = async (examId) => {
    const exam = await Exam.findById(examId).populate('questions');
    if (!exam) {
        throw new NotFound('Exam not found');
    }
    return exam;
};

// ✅ HELPER: Validate attempt exists
export const validateAttemptExists = async (attemptId) => {
    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) {
        throw new NotFound('Exam attempt not found');
    }
    return attempt;
};

// ✅ HELPER: Check if user owns exam
export const checkExamOwnership = (exam, userId, userRole) => {
    if (exam.createdBy.toString() !== userId && userRole !== 'admin') {
        throw new Forbidden('You do not have permission to manage this exam');
    }
};

// ✅ HELPER: Check if user owns attempt
export const checkAttemptOwnership = (attempt, userId, userRole) => {
    if (attempt.student.toString() !== userId && userRole !== 'teacher' && userRole !== 'admin') {
        throw new Forbidden('You do not have permission to view this attempt');
    }
};

// ✅ HELPER: Check for submitted attempts
export const checkSubmittedAttempts = async (examId) => {
    const exists = await ExamAttempt.findOne({
        exam: examId,
        submittedAt: { $ne: null }
    });
    if (exists) {
        throw new BadRequest('Cannot modify exam - students have already submitted attempts');
    }
};

// ✅ HELPER: Check for any attempts
export const checkExistingAttempts = async (examId) => {
    const count = await ExamAttempt.countDocuments({ exam: examId });
    if (count > 0) {
        throw new BadRequest(`Cannot delete exam - there are ${count} existing student attempts`);
    }
};

// ✅ HELPER: Check exam time window
export const checkExamTimeWindow = (exam, now = new Date()) => {
    if (exam.startTime && exam.startTime > now) {
        throw new BadRequest('Exam has not started yet');
    }
    if (exam.endTime && exam.endTime < now) {
        throw new BadRequest('Exam has ended');
    }
};

// ✅ HELPER: Validate time range
export const validateTimeRange = (startTime, endTime) => {
    if (startTime && endTime && new Date(startTime) >= new Date(endTime)) {
        throw new BadRequest('startTime must be before endTime');
    }
};

// ✅ HELPER: Validate duration
export const validateDuration = (duration) => {
    if (duration && duration <= 0) {
        throw new BadRequest('Duration must be greater than 0 minutes');
    }
};
