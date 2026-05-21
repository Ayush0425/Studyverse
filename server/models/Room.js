import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  sharedNotes: {
    type: String, // Dynamic markdown/text notepad shared in real-time
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const Room = mongoose.model('Room', roomSchema);
export default Room;
