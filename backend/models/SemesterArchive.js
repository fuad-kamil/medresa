import mongoose from 'mongoose'

const semesterArchiveSchema = new mongoose.Schema(
    {
        ustaz: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        ustazName: {
            type: String,
            required: true
        },
        endedAt: {
            type: Date,
            default: Date.now
        },
        studentsSnapshot: [
            {
                studentId: mongoose.Schema.Types.ObjectId,
                fullName: String,
                stream: String,
                surah: String,
                presentCount: Number,
                absentCount: Number,
                excusedCount: Number,
                examScores: {
                    type: Map,
                    of: Number
                }
            }
        ]
    },
    { timestamps: true }
)

const SemesterArchive = mongoose.model('SemesterArchive', semesterArchiveSchema)

export default SemesterArchive
