import express from 'express';
import { getRooms, createRoom, getRoomByCode } from '../controllers/roomController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // Require auth for all rooms routes

router.route('/')
  .get(getRooms)
  .post(createRoom);

router.route('/:code')
  .get(getRoomByCode);

export default router;
