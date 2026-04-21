import express from 'express';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Helper function to calculate distance in Kilometers (Haversine formula)
function getDistanceInKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

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

// UPDATED: POST /sos (Citizen emergency alert to LOCAL police)
router.post('/sos', verifyToken, async (req, res) => {
  try {
    const { location, lat, lng } = req.body;
    const citizen = await User.findById(req.user.userId);
    
    // Fetch all police officers
    const allPolice = await User.find({ role: 'police' });
    
    // Filter for LOCAL police (e.g., within 5km radius)
    let localPolice = allPolice.filter(officer => {
      // If the police officer profile has GPS coordinates saved
      if (officer.lat && officer.lng && lat && lng) {
        const distance = getDistanceInKm(lat, lng, officer.lat, officer.lng);
        return distance <= 5; // Set your desired radius in km here
      }
      
      // Fallback: If no coordinates exist in DB, try matching the city name from the address string
      if (officer.address && location && location !== "Current Live GPS Location") {
         const citizenCity = location.split(',')[0].trim().toLowerCase();
         return officer.address.toLowerCase().includes(citizenCity);
      }
      return true; // Failsafe: if we can't calculate distance, send it to them just in case
    });

    // Ultimate Failsafe: If filtering accidentally removed EVERYONE, alert all police as a backup
    if (localPolice.length === 0) {
      localPolice = allPolice;
    }

    // Insert DB Notifications ONLY for the local police
    const notifications = localPolice.map(officer => ({
      recipient: officer._id,
      message: `🚨 EMERGENCY SOS! Citizen ${citizen.fullName} requires immediate help at ${location || 'Current GPS Location'}. GPS: ${lat || '0.0'}, ${lng || '0.0'}`,
      type: 'alert',
    }));

    await Notification.insertMany(notifications);

    // Emit real-time event via Socket.io
    const io = req.app.get('io');
    if (io) {
      // Create an array of target officer IDs
      const targetIds = localPolice.map(officer => officer._id.toString());
      
      io.emit('sos_alert', {
        message: `🚨 EMERGENCY SOS! Citizen ${citizen.fullName} requires immediate help!`,
        location: location || 'Current GPS Location',
        lat,
        lng,
        citizenName: citizen.fullName,
        targetOfficers: targetIds // Send the list of local officers to the frontend
      });
    }

    res.json({ success: true, message: `Emergency alert sent to ${localPolice.length} local police units.` });
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