import mongoose from 'mongoose'

const quranProgressLogSchema = new mongoose.Schema(
    {
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
        juz: {
            type: Number,
            required: true
        },
        surah: {
            type: String,
            required: true
        },
        verseStart: {
            type: Number,
            required: true
        },
        verseEnd: {
            type: Number,
            required: true
        },
        type: {
            type: String,
            enum: ['hifz', 'murajaah', 'tilawah', 'nezer'],
            required: true
        },
        notes: {
            type: String,
            required: false
        }
    },
    { timestamps: true }
)

const QuranProgressLog = mongoose.model('QuranProgressLog', quranProgressLogSchema)

export default QuranProgressLog
