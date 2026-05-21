import express from 'express';
import { getNotes, createNote, toggleBookmark, deleteNote } from '../controllers/noteController.js';
import { protect } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.use(protect); // Require auth for all notes routes

router.route('/')
  .get(getNotes)
  .post(upload.single('file'), createNote);

router.route('/:id')
  .delete(deleteNote);

router.route('/:id/bookmark')
  .put(toggleBookmark);

export default router;
