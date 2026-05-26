import express from 'express';
import { registerUser, authUser, getUserProfile, updateUserSubjects, updateUserFocus } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/signup', registerUser);
router.post('/login', authUser);
router.get('/profile', protect, getUserProfile);
router.put('/subjects', protect, updateUserSubjects);
router.put('/focus', protect, updateUserFocus);

export default router;
