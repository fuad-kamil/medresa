import mongoose from 'mongoose'

const studentSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true
        },
        photo: {
            type: String,
            required: false
        },
        surah: {
            type: String,
            required: false
        },
        stream: {
            type: String,
            enum: ['quran', 'kitab'],
            default: 'quran'
        },
        quranProgress: {
            juz: { type: Number, default: 1 },
            surah: { type: String, default: "Al-Fatiha" },
            verseStart: { type: Number, default: 1 },
            verseEnd: { type: Number, default: 7 },
            type: { type: String, enum: ['hifz', 'murajaah', 'tilawah', 'nezer'], default: 'hifz' },
            updatedAt: { type: Date, default: Date.now }
        },

        fatherPhone: {
            type: String,
            required: true
        },
        motherPhone: {
            type: String,
            required: false
        },
        assignedUstaz: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: false
        },
        address: {
            type: String,
            required: false
        },
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active'
        },
        firstExam: {
            type: Number,
            default: 0
        },
        secondExam: {
            type: Number,
            default: 0
        },
        finalExam: {
            type: Number,
            default: 0
        },
        examScores: {
            type: Map,
            of: Number,
            default: {}
        },
        reportCardUrl: {
            type: String,
            required: false
        },
        reportCardPublicId: {
            type: String,
            required: false
        },
        reportScoresHash: {
            type: String,
            required: false
        },
        reportCardGeneratedAt: {
            type: Date,
            required: false
        }
    },
    { timestamps: true }
)

const Student = mongoose.model('Student', studentSchema)

export default Student