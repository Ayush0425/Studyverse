import express from 'express';
import { generateQuiz, submitQuiz, getQuizzes } from '../controllers/quizController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // Require auth for all quiz routes

router.post('/generate', generateQuiz);
router.post('/submit', submitQuiz);
router.get('/', getQuizzes);

export default router;
