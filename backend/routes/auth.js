import express from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { 
      email, password, fullName, role, 
      phone, aadhaarNumber, badgeNumber, licenseNumber, courtAssignment,
      specialization, address, lat, lng
    } = req.body;

    if (!email || !password || !fullName || !role || !phone || !aadhaarNumber) {
      return res.status(400).json({ message: 'Mandatory fields (Email, Password, Name, Role, Phone, Aadhaar) are required' });
    }

    // Role-specific mandatory fields
    if (role === 'police' && !badgeNumber) {
      return res.status(400).json({ message: 'Police badge number is required' });
    }
    if (role === 'lawyer' && !licenseNumber) {
      return res.status(400).json({ message: 'Lawyer license number is required' });
    }
    if (role === 'lawyer' && !specialization) {
      return res.status(400).json({ message: 'Lawyer specialization is required' });
    }
    if (role === 'judge' && !courtAssignment) {
      return res.status(400).json({ message: 'Court assignment is required for Judges' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    const user = new User({
      email,
      password: hashedPassword,
      fullName,
      role,
      phone,
      aadhaarNumber,
      badgeNumber,
      licenseNumber,
      courtAssignment,
      specialization: specialization || null,
      address,
      lat,
      lng
    });
    
    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'NYAYASARTHI_SECRET_NODE_KEY',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("REGISTRATION ERROR:", error); // Added for diagnostics
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'NYAYASARTHI_SECRET_NODE_KEY',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
