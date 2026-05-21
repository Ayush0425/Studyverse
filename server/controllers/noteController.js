import Note from '../models/Note.js';
import fs from 'fs';
import path from 'path';

// @desc    Get all notes for authenticated user
// @route   GET /api/notes
// @access  Private
export const getNotes = async (req, res) => {
  try {
    const { search, folder, bookmarked } = req.query;
    const query = { user: req.user._id };

    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    if (folder) {
      query.folder = folder;
    }

    if (bookmarked === 'true') {
      query.bookmarked = true;
    }

    const notes = await Note.find(query).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new note (text or uploaded file)
// @route   POST /api/notes
// @access  Private
export const createNote = async (req, res) => {
  try {
    const { title, folder, content, fileType } = req.body;
    let finalContent = content;
    let finalFileType = fileType || 'text';

    // If file is uploaded
    if (req.file) {
      finalContent = `/uploads/${req.file.filename}`;
      // Determine file type based on extension
      const ext = path.extname(req.file.originalname).toLowerCase();
      if (ext === '.pdf') {
        finalFileType = 'pdf';
      } else if (['.jpg', '.jpeg', '.png'].includes(ext)) {
        finalFileType = 'image';
      } else {
        finalFileType = 'text';
        // Read text content and store it directly if it is a text file
        try {
          const fileData = fs.readFileSync(req.file.path, 'utf8');
          finalContent = fileData;
        } catch (err) {
          console.error("Error reading uploaded text file:", err);
        }
      }
    }

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    if (!finalContent) {
      return res.status(400).json({ message: 'Content or file is required' });
    }

    const note = await Note.create({
      title,
      content: finalContent,
      fileType: finalFileType,
      folder: folder || 'General',
      user: req.user._id,
    });

    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle note bookmark
// @route   PUT /api/notes/:id/bookmark
// @access  Private
export const toggleBookmark = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    note.bookmarked = !note.bookmarked;
    await note.save();

    res.json(note);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a note
// @route   DELETE /api/notes/:id
// @access  Private
export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // If it is a file upload, delete local file
    if (note.content.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), note.content);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Note.deleteOne({ _id: note._id });
    res.json({ message: 'Note removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
