import mongoose from 'mongoose';

const focusLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  duration: {
    type: Number, // Duration in seconds
    required: true,
  },
  subject: {
    type: String,
    default: 'General',
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const FocusLog = mongoose.model('FocusLog', focusLogSchema);
export default FocusLog;
