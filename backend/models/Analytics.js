import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['citizen', 'police', 'lawyer', 'judge'],
    required: true,
  },
  actionType: String,
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Case',
  },
  details: mongoose.Schema.Types.Mixed,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Analytics', analyticsSchema);
