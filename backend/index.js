import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';

// Import routes
import authRoutes from './routes/auth.js';
import caseRoutes from './routes/cases.js';
import chatRoutes from './routes/chat.js';
import chatbotRoutes from './routes/chatbot.js';
import analyticsRoutes from './routes/analytics.js';
import userRoutes from './routes/users.js';

import cron from 'node-cron';
import Case from './models/Case.js';
import Notification from './models/Notification.js';
import notificationRoutes from './routes/notifications.js';


dotenv.config();

const app = express();
app.use('/api/notifications', notificationRoutes);
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(null, true); // allow in dev for any localhost
  },
  credentials: true,
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Health check (so frontend can verify backend is reachable)
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/users', userRoutes);

// Socket.io events
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
  });

  socket.on('send_message', (data) => {
    io.to(data.roomId).emit('receive_message', data);
  });

  socket.on('typing', (data) => {
    socket.to(data.roomId).emit('user_typing', data);
  });

  socket.on('stop_typing', (data) => {
    socket.to(data.roomId).emit('user_stop_typing', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// --- DEADLINE MONITOR (Runs every day at midnight) ---
cron.schedule('0 0 * * *', async () => {
  console.log('Running Deadline Check...');
  
  const today = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(today.getDate() + 3);

  try {
    // Find active cases where deadline is within 3 days
    const criticalCases = await Case.find({
      status: { $ne: 'resolved' },
      deadlineDate: { $lte: threeDaysFromNow, $gte: today }
    });

    for (const c of criticalCases) {
      const daysLeft = Math.ceil((new Date(c.deadlineDate) - today) / (1000 * 60 * 60 * 24));
      const message = `URGENT: Case #${c.caseNumber} deadline is approaching! Only ${daysLeft} days remaining.`;

      // Notify Lawyer
      if (c.assignedLawyer) {
        await new Notification({ recipient: c.assignedLawyer, message, type: 'warning', caseId: c._id }).save();
      }

      // Notify Police
      if (c.assignedPolice) {
        await new Notification({ recipient: c.assignedPolice, message, type: 'warning', caseId: c._id }).save();
      }
    }
    console.log(`Sent deadline alerts for ${criticalCases.length} cases.`);
  } catch (err) {
    console.error('Error in cron job:', err);
  }
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { io };
