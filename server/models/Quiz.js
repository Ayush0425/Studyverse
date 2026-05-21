import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  options: {
    type: [String], // Array of options (empty if true/false or short answer)
    default: [],
  },
  answer: {
    type: String, // Correct option index or text
    required: true,
  },
  type: {
    type: String,
    enum: ['mcq', 'tf', 'short'],
    required: true,
  }
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  note: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note',
  },
  questions: [questionSchema],
  score: {
    type: Number,
    default: 0,
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;
