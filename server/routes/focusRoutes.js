import express from 'express';
import { logFocusSession, getFocusStats } from '../controllers/focusController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All focus routes are private

router.post('/log', logFocusSession);
router.get('/stats', getFocusStats);

export default router;
