import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'ustaz'],
        default: 'ustaz'
    },
    phone: {
        type: String
    },
    stream: {
        type: String,
        enum: ['quran', 'kitab'],
        default: 'quran'
    },
    kitabName: {
        type: String,
        trim: true
    },
    teachingDays: {
        type: [Number],
        default: [0, 1, 2, 3, 4, 5, 6]
    },
    studentPhoneOption: {
        type: Number,
        enum: [1, 2],
        default: 1
    },
    semesterStatus: {
        type: String,
        enum: ['active', 'ended'],
        default: 'active'
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    telegramChatId: {
        type: String,
        unique: true,
        sparse: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const User = mongoose.model('User', userSchema)

export default User