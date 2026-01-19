import Exam from '../models/Exam.js';

// Check if user is the exam creator or admin
export const canManageExam = async (req, res, next) => {
    try {
        const { examId } = req.params || req.body;
        
        if (!examId) {
            return res.status(400).json({ message: 'Exam ID is required' });
        }

        const exam = await Exam.findById(examId);
        
        if (!exam) {
            return res.status(404).json({ message: 'Exam not found' });
        }

        // Check if user is admin or the creator
        if (req.user.role === 'admin' || exam.createdBy.toString() === req.user.id) {
            next();
        } else {
            return res.status(403).json({ message: 'You do not have permission to manage this exam' });
        }
    } catch (err) {
        console.error('Error in canManageExam middleware:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

export default { canManageExam };
