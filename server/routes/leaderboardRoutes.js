import express from 'express';
import { getLeaderboard } from '../controllers/leaderboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // Require auth for leaderboard

router.get('/', getLeaderboard);

export default router;
