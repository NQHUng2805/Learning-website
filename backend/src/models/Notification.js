import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    type: {
        type: String,
        enum: ['exam_assigned', 'quiz_assigned', 'score_available', 'course_updated', 'general'],
        default: 'general'
    },

    title: {
        type: String,
        required: true
    },

    message: {
        type: String,
        required: true
    },

    relatedEntity: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'entityType'
    },

    entityType: {
        type: String,
        enum: ['Exam', 'Quiz', 'Course', null],
        default: null
    },

    isRead: {
        type: Boolean,
        default: false
    },

    readAt: {
        type: Date,
        default: null
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }

}, { timestamps: true });

export default mongoose.model('Notification', NotificationSchema);
