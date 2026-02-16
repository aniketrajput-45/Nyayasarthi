import express from 'express';
import Notification from '../models/Notification.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// 1. Get My Notifications
router.get('/', verifyToken, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.userId })
      .sort({ createdAt: -1 }) // Newest first
      .limit(20);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// 2. Mark as Read
router.put('/:id/read', verifyToken, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error updating notification' });
  }
});

// 3. Mark ALL as Read
router.put('/read-all', verifyToken, async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user.userId }, { read: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error clearing notifications' });
  }
});

export default router;