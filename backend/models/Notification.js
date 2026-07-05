import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    studentName: {
        type: String,
        required: true
    },
    ustazId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    ustazName: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    readBy: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now,
        // Auto-delete after 30 days
        expires: 60 * 60 * 24 * 30
    }
})

const Notification = mongoose.model('Notification', notificationSchema)

export default Notification
