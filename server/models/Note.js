import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  content: {
    type: String, // Can store raw text, html or file URL
    required: true,
  },
  fileType: {
    type: String,
    enum: ['text', 'pdf', 'image'],
    default: 'text',
  },
  folder: {
    type: String,
    default: 'General',
    trim: true,
  },
  bookmarked: {
    type: Boolean,
    default: false,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

const Note = mongoose.model('Note', noteSchema);
export default Note;
