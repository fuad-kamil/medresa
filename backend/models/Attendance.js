import mongoose from 'mongoose'

const attendanceSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    ustaz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'excused'],
        required: true
    },
    notes: String
})

const Attendance = mongoose.model('Attendance', attendanceSchema)

export default Attendance