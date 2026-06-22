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
    isApproved: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const User = mongoose.model('User', userSchema)

export default User