import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['citizen', 'police', 'lawyer', 'judge'],
    required: true,
  },
  address: { type: String }, // For Citizen: Home. For Police: Station. For Judge: Court.
  lat: { type: Number },
  lng: { type: Number },
  phone: String,
  aadhaarNumber: String,
  profileImage: String,
  badgeNumber: String,
  licenseNumber: String,
  specialization: {
    type: String,
    enum: ['criminal', 'civil', 'cyber', 'family', 'corporate', 'commercial', 'property', 'general', null],
    default: null
  },
  courtAssignment: String,
  casesCount: {
    type: Number,
    default: 0,
  },
  documentLocker: [
    {
      fileName: String,
      fileUrl: String,
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('User', userSchema);
