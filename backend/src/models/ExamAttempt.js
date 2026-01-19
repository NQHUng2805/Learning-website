import mongoose from 'mongoose';

const ExamAttemptSchema = new mongoose.Schema({
    student: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    
    exam: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Exam', 
        required: true 
    },

    // ✅ Security: Auto-generated secure token
    attemptToken: {
        type: String,
        required: true,
        unique: true,
        index: true
    },

    answers: [{
        questionId: { type: mongoose.Schema.Types.ObjectId },
        selectedOption: { type: String } // VD: "A", "B"...
    }],

    // Kết quả
    score: { type: Number, default: 0 },
    isPassed: { type: Boolean, default: false },

    aiLogs: {
        faceMissingDuration: { type: Number, default: 0 }, // Tổng số giây mất mặt
        emotionStats: { type: Object, default: {} }, // VD: { "Neutral": "80%", "Fear": "10%" }
        suspiciousActions: { type: Number, default: 0 } // Số lần cảnh báo
    },

    startedAt: { type: Date },
    submittedAt: { type: Date },

}, { timestamps: true });

export default mongoose.model('ExamAttempt', ExamAttemptSchema);