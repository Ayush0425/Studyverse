import Room from '../models/Room.js';

// Helper to generate a random 6-character room code
const generateRoomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// @desc    Get all study rooms
// @route   GET /api/rooms
// @access  Private
export const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find().populate('host', 'name email').sort({ createdAt: -1 });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new study room
// @route   POST /api/rooms
// @access  Private
export const createRoom = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Room name is required' });
  }

  try {
    let code = generateRoomCode();
    // Ensure uniqueness
    let exists = await Room.findOne({ code });
    while (exists) {
      code = generateRoomCode();
      exists = await Room.findOne({ code });
    }

    const room = await Room.create({
      name,
      code,
      host: req.user._id,
      members: [req.user._id],
    });

    const populatedRoom = await Room.findById(room._id).populate('host', 'name email');
    res.status(201).json(populatedRoom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get study room by code
// @route   GET /api/rooms/:code
// @access  Private
export const getRoomByCode = async (req, res) => {
  try {
    const room = await Room.findOne({ code: req.params.code.toUpperCase() })
      .populate('host', 'name email')
      .populate('members', 'name email xp level');

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
