import express from 'express';
import questionController from '../controllers/questionController.js';
import { authenticateToken, isAdmin, isTeacher } from '../middleware/authMiddleware.js';

const router = express.Router();

// CREATE QUESTION 
router.post('/', authenticateToken, isTeacher, questionController.createQuestion);

// GET ALL QUESTIONS REFERENCE
router.get('/', authenticateToken, questionController.getAllQuestionsReference);

// GET ALL QUESTIONS
router.get('/all', authenticateToken, questionController.getAllQuestions);

// GET MANY QUESTIONS
router.get('/many', authenticateToken, questionController.getManyQuestions);

// UPDATE QUESTION 
router.put('/edit/:id', authenticateToken, isTeacher, questionController.updateQuestionById);

// DELETE QUESTION BY ID 
router.delete('/delete/:id', authenticateToken, isTeacher, questionController.deleteQuestionById);

// DELETE MANY QUESTIONS 
router.delete('/deleteMany', authenticateToken, isTeacher, questionController.deleteManyQuestions);

// GET QUESTION BY ID
router.get('/:id', authenticateToken, questionController.getQuestionById);

export default router;