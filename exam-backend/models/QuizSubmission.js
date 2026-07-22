import mongoose from 'mongoose';

const quizSubmissionSchema = new mongoose.Schema(
  {
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    correctAnswers: { type: Number, required: true },
    answers: [{ type: Number }], // option indices chosen by student
    syncedToMain: { type: Boolean, default: false },
    completedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// One submission per student per quiz
quizSubmissionSchema.index({ quizId: 1, studentId: 1 }, { unique: true });

const QuizSubmission = mongoose.model('QuizSubmission', quizSubmissionSchema);
export default QuizSubmission;
