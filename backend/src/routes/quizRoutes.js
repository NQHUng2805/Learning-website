import express from 'express';
import quizController from '../controllers/quizController.js';
import { authenticateToken, isAdmin, isTeacher } from '../middleware/authMiddleware.js';

const router = express.Router();

// CREATE QUIZ 
router.post('/', authenticateToken, isTeacher, quizController.createQuiz);

// GET ALL QUIZZES
router.get('/', authenticateToken, quizController.getAllQuizzes);

// GET MANY QUIZZES - Must come before /:id to avoid route collision
router.get('/many', authenticateToken, quizController.getManyQuizzes);

// GET QUESTION IN QUIZ - Must come before /:id to avoid route collision
router.get('/questions/:id', authenticateToken, quizController.getQuestionsByQuizId);

// UPDATE QUIZ BY ID 
router.put('/edit/:id', authenticateToken, isTeacher, quizController.updateQuizById);

// DELETE QUIZ BY ID 
router.delete('/delete/:id', authenticateToken, isTeacher, quizController.deleteQuizById);

// DELETE MANY QUIZZES 
router.delete('/deleteMany', authenticateToken, isTeacher, quizController.deleteManyQuizzes);

// GET QUIZ BY ID - Must be last to avoid route collision
router.get('/:id', authenticateToken, quizController.getQuizById);

export default router;