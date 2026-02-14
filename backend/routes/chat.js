import express from 'express';
import { ChatMessage, ChatRoom } from '../models/Chat.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get or create chat room
router.post('/room', verifyToken, async (req, res) => {
  try {
    const { participant2 } = req.body;
    const participant1 = req.user.userId;

    let room = await ChatRoom.findOne({
      $or: [
        { participant1, participant2 },
        { participant1: participant2, participant2: participant1 },
      ],
    });

    if (!room) {
      room = new ChatRoom({
        participant1,
        participant2,
      });
      await room.save();
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({ message: 'Error managing chat room', error: error.message });
  }
});

// Get chat messages
router.get('/messages/:roomId', verifyToken, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ roomId: req.params.roomId })
      .populate('senderId', 'fullName email profileImage')
      .sort({ createdAt: 1 })
      .limit(100);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
});

// Send message
router.post('/message', verifyToken, async (req, res) => {
  try {
    const { roomId, message } = req.body;

    const newMessage = new ChatMessage({
      roomId,
      senderId: req.user.userId,
      message,
    });

    await newMessage.save();

    // Update room's last message
    await ChatRoom.findByIdAndUpdate(
      roomId,
      {
        lastMessage: message,
        lastMessageTime: new Date(),
      }
    );

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
});

// Get user's chat rooms
router.get('/rooms/user/:userId', verifyToken, async (req, res) => {
  try {
    const rooms = await ChatRoom.find({
      $or: [
        { participant1: req.user.userId },
        { participant2: req.user.userId },
      ],
    })
      .populate('participant1', 'fullName email profileImage')
      .populate('participant2', 'fullName email profileImage')
      .sort({ lastMessageTime: -1 });

    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching rooms', error: error.message });
  }
});

// Mark messages as read
router.put('/message/:messageId/read', verifyToken, async (req, res) => {
  try {
    await ChatMessage.findByIdAndUpdate(req.params.messageId, { read: true });
    res.json({ message: 'Message marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking message', error: error.message });
  }
});

export default router;
