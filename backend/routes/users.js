import express from 'express';
import User from '../models/User.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get all users (for chat and assignment)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { role, search } = req.query;
    let query = {};

    if (role) {
      query.role = role;
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Get user profile
router.get('/:userId', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

// Update user profile
router.put('/:userId', verifyToken, async (req, res) => {
  try {
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const { phone, address, badgeNumber, licenseNumber, courtAssignment, profileImage, lat, lng } = req.body;

    const updateData = {};
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (badgeNumber) updateData.badgeNumber = badgeNumber;
    if (licenseNumber) updateData.licenseNumber = licenseNumber;
    if (courtAssignment) updateData.courtAssignment = courtAssignment;
    if (profileImage) updateData.profileImage = profileImage;
    if (lat !== undefined) updateData.lat = lat;
    if (lng !== undefined) updateData.lng = lng;

    const user = await User.findByIdAndUpdate(req.params.userId, updateData, { new: true }).select('-password');

    res.json({ message: 'Profile updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// GET user document locker
router.get('/:userId/documents', verifyToken, async (req, res) => {
  try {
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const user = await User.findById(req.params.userId).select('documentLocker');
    res.json(user.documentLocker || []);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching documents', error: error.message });
  }
});

// POST to user document locker
router.post('/:userId/documents', verifyToken, async (req, res) => {
  try {
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const { fileName, fileUrl } = req.body;
    const user = await User.findById(req.params.userId);
    user.documentLocker.push({ fileName, fileUrl, uploadedAt: new Date() });
    await user.save();
    res.status(201).json(user.documentLocker);
  } catch (error) {
    res.status(500).json({ message: 'Error uploading document', error: error.message });
  }
});

// DELETE from user document locker
router.delete('/:userId/documents/:docId', verifyToken, async (req, res) => {
  try {
    if (req.user.userId !== req.params.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    const user = await User.findById(req.params.userId);
    user.documentLocker = user.documentLocker.filter(doc => doc._id.toString() !== req.params.docId);
    await user.save();
    res.json(user.documentLocker);
  } catch (error) {
    res.status(500).json({ message: 'Error deleting document', error: error.message });
  }
});

export default router;
