import mongoose from 'mongoose';

const examSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        maxScore: {
            type: Number,
            default: 100
        }
    },
    { timestamps: true }
);

const Exam = mongoose.model('Exam', examSchema);
export default Exam;
