import mongoose from 'mongoose';

const quizSubmissionSchema = new mongoose.Schema(
  {
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    studentId: { type: String, required: true },
    studentName: { type: String, required: true },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    correctAnswers: { type: Number, required: true },
    answers: [{ type: mongoose.Schema.Types.Mixed }], // Numbers for MCQ, strings for open questions
    openAnswerScores: [{ type: Number }],              // Ustaz-assigned scores per open question
    manualGradeStatus: {
      type: String,
      enum: ['pending', 'graded', 'not_required'],
      default: 'not_required'
    },
    syncedToMain: { type: Boolean, default: false },
    isTimeoutSubmit: { type: Boolean, default: false },
    startedAt: { type: Date },
    completedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

// One submission per student per quiz
quizSubmissionSchema.index({ quizId: 1, studentId: 1 }, { unique: true });

const QuizSubmission = mongoose.model('QuizSubmission', quizSubmissionSchema);
export default QuizSubmission;
