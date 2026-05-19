import mongoose from 'mongoose'

const studentSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: true
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
        status: {
            type: String,
            enum: ['active', 'inactive'],
            default: 'active'
        }
    },
    { timestamps: true }
)

const Student = mongoose.model('Student', studentSchema)

export default Student