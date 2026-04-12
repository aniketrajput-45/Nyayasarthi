import express from 'express';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
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

// NEW: POST /sos (Citizen emergency alert to all police)
router.post('/sos', verifyToken, async (req, res) => {
  try {
    const { location, lat, lng } = req.body;
    const citizen = await User.findById(req.user.userId);
    
    // Find all police officers
    const policeOfficers = await User.find({ role: 'police' });
    
    const notifications = policeOfficers.map(officer => ({
      recipient: officer._id,
      message: `🚨 EMERGENCY SOS! Citizen ${citizen.fullName} requires immediate help at ${location || 'Current GPS Location'}. GPS: ${lat || '0.0'}, ${lng || '0.0'}`,
      type: 'alert',
    }));

    await Notification.insertMany(notifications);

    // Emit real-time event via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('sos_alert', {
        message: `🚨 EMERGENCY SOS! Citizen ${citizen.fullName} requires immediate help!`,
        location: location || 'Current GPS Location',
        lat,
        lng,
        citizenName: citizen.fullName
      });
    }

    res.json({ success: true, message: 'Emergency alert sent to all nearest police units.' });
  } catch (error) {
    res.status(500).json({ message: 'Error sending SOS alert', error: error.message });
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