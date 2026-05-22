import express from 'express';
import { registerUser, authUser, getUserProfile, updateUserSubjects } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', registerUser);
router.post('/login', authUser);
router.get('/profile', protect, getUserProfile);
router.put('/subjects', protect, updateUserSubjects);

export default router;
