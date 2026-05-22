import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'studyverse_secret_token_jwt_9988', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      xp: 0,
      level: 1,
      streak: 0,
      lastActive: new Date(),
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        badges: user.badges,
        subjects: user.subjects,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate a user & get token
// @route   POST /api/auth/login
// @access  Public
export const authUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      // Manage/update daily streak
      const today = new Date();
      const lastActiveDate = new Date(user.lastActive);
      
      // Calculate difference in days
      const diffTime = Math.abs(today - lastActiveDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let newStreak = user.streak;
      if (diffDays <= 1) {
        // Active today or yesterday, streak continues if it was yesterday
        if (diffDays > 0.5 && lastActiveDate.getDate() !== today.getDate()) {
          newStreak += 1;
        } else if (newStreak === 0) {
          newStreak = 1; // Start streak if 0
        }
      } else {
        // Streak broken
        newStreak = 1;
      }

      user.streak = newStreak;
      user.lastActive = today;
      await user.save();

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        badges: user.badges,
        subjects: user.subjects,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        badges: user.badges,
        subjects: user.subjects,
        createdAt: user.createdAt,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user subjects
// @route   PUT /api/auth/subjects
// @access  Private
export const updateUserSubjects = async (req, res) => {
  const { subjects } = req.body;

  if (!Array.isArray(subjects)) {
    return res.status(400).json({ message: 'Subjects must be an array of strings' });
  }

  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.subjects = subjects;
      await user.save();
      res.json({
        _id: user._id,
        subjects: user.subjects,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

