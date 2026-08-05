import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionType: {
    type: String,
    enum: ['multiple_choice', 'short_answer', 'fill_blank'],
    default: 'multiple_choice'
  },
  sectionTitle: { type: String, default: '' },
  questionText: { type: String, required: true },
  options: [{ type: String }],
  correctOptionIndex: { type: Number, default: null }
});

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    ustazId: { type: String, required: true },
    ustazName: { type: String, default: 'Ustaz' },
    examColumnId: { type: String, required: true },
    examColumnName: { type: String, required: true },
    durationMinutes: { type: Number, default: 30 },
    addedTimeMinutes: { type: Number, default: 0 },
    hasTimer: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['draft', 'active', 'ended'],
      default: 'active'
    },
    isLocked: { type: Boolean, default: false },
    maxScore: { type: Number, default: 100 },
    questions: [questionSchema]
  },
  { timestamps: true }
);

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;
