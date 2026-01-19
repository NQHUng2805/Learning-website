import express from 'express';
import * as examController from '../controllers/examController.js';
import { authenticateToken, isAdmin, isTeacher } from '../middleware/authMiddleware.js';
import { canManageExam } from '../middleware/examPermission.js';

const router = express.Router();

// ============================================
// ⚠️ CRITICAL: Order matters! Specific routes BEFORE generic ones
// ============================================

// ✅ SPECIAL ROUTES (must come first to avoid collision with /:id)
router.post('/start', authenticateToken, examController.startExam);
router.post('/submit', authenticateToken, examController.submitExam);
router.get('/attempt/:attemptId', authenticateToken, examController.getAttemptById);
router.get('/history/:examId', authenticateToken, isTeacher, examController.getExamHistory);

// ✅ EXAM MANAGEMENT ROUTES
router.post('/:examId/assign', authenticateToken, isTeacher, examController.assignExamToStudents);
router.get('/:examId/results', authenticateToken, isTeacher, examController.getExamResults);

// ✅ TEACHER/ADMIN ROUTES
router.post('/', authenticateToken, isTeacher, examController.createExam);
router.put('/:examId', authenticateToken, isTeacher, canManageExam, examController.updateExam);
router.delete('/:examId', authenticateToken, isTeacher, canManageExam, examController.deleteExam);

// ✅ STUDENT ROUTES (generic routes at the end)
router.get('/', authenticateToken, examController.getExams);
router.get('/:id', authenticateToken, examController.getExamDetail);

export default router;