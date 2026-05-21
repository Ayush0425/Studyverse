import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import connectDB from './config/db.js';
import Room from './models/Room.js';
import User from './models/User.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import noteRoutes from './routes/noteRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import focusRoutes from './routes/focusRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';

// Configure dotenv
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: '*', // For development allow any origin
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve static uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/focus', focusRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Simple Health Check
app.get('/', (req, res) => {
  res.send('Studyverse API is running...');
});

// Socket.io Connection Logic
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join Room
  socket.on('join_room', async ({ roomCode, user }) => {
    socket.join(roomCode);
    console.log(`User ${user.name} (${socket.id}) joined room: ${roomCode}`);

    try {
      // Add user to Room members in DB
      const dbRoom = await Room.findOne({ code: roomCode });
      if (dbRoom && user._id) {
        if (!dbRoom.members.includes(user._id)) {
          dbRoom.members.push(user._id);
          await dbRoom.save();
        }
      }
      
      // Notify other members
      socket.to(roomCode).emit('member_joined', user);
      
      // Send current notepad content to the newly joined member
      if (dbRoom) {
        socket.emit('receive_notes', dbRoom.sharedNotes);
      }
    } catch (err) {
      console.error('Socket join_room error:', err);
    }
  });

  // Leave Room
  socket.on('leave_room', async ({ roomCode, user }) => {
    socket.leave(roomCode);
    console.log(`User ${user?.name} left room: ${roomCode}`);

    try {
      const dbRoom = await Room.findOne({ code: roomCode });
      if (dbRoom && user?._id) {
        dbRoom.members = dbRoom.members.filter(id => id.toString() !== user._id.toString());
        await dbRoom.save();
      }
      
      socket.to(roomCode).emit('member_left', user);
    } catch (err) {
      console.error('Socket leave_room error:', err);
    }
  });

  // Group Chat Message
  socket.on('send_message', ({ roomCode, message, user }) => {
    const chatMsg = {
      message,
      user,
      timestamp: new Date(),
    };
    io.to(roomCode).emit('receive_message', chatMsg);
  });

  // Shared Notepad Collaboration
  socket.on('update_notes', async ({ roomCode, notes }) => {
    // Broadcast notes to all other sockets in room
    socket.to(roomCode).emit('receive_notes', notes);
    
    // Save to database
    try {
      await Room.findOneAndUpdate({ code: roomCode }, { sharedNotes: notes });
    } catch (err) {
      console.error('Socket update_notes DB error:', err);
    }
  });

  // Shared Pomodoro Synced Timer
  socket.on('sync_timer', ({ roomCode, timerState }) => {
    // Host syncs timer state: { secondsLeft, isRunning, isBreak }
    socket.to(roomCode).emit('receive_timer_sync', timerState);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
