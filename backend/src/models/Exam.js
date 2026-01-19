import mongoose from 'mongoose';

const ExamSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    
    course: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Course', 
        required: true 
    },
    
    questions: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Question' 
    }],

    // ✅ NEW: Track assigned students
    assignedStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    duration: { type: Number, required: true }, // Tính bằng phút (VD: 45 phút)
    startTime: { type: Date }, // Ngày giờ mở đề
    endTime: { type: Date },   // Ngày giờ đóng đề

    isProctored: { type: Boolean, default: true }, 
    
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, 
}, { timestamps: true });

export default mongoose.model('Exam', ExamSchema);