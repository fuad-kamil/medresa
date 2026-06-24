import mongoose from 'mongoose';

const examSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        maxScore: {
            type: Number,
            default: 100
        },
        // If set, this exam column belongs exclusively to that Ustaz.
        // If null/undefined, it is a legacy global exam column.
        ustaz: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        }
    },
    { timestamps: true }
);

// Unique per (name, ustaz) pair — same name can exist for different ustazs
examSchema.index({ name: 1, ustaz: 1 }, { unique: true });

const Exam = mongoose.model('Exam', examSchema);
export default Exam;
