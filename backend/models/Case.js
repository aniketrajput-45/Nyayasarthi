import mongoose from 'mongoose';

const caseSchema = new mongoose.Schema({
  caseNumber: {
    type: String,
    unique: true,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['civil', 'criminal', 'commercial', 'family', 'property', 'other'],
    required: true,
  },
  filedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedPolice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  assignedLawyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  assignedJudge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['filed', 'under-investigation', 'in-court', 'resolved'],
    default: 'filed',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  // ADD THIS NEW FIELD:
  isProBono: {
    type: Boolean,
    default: false,
  },
  location: String,
  incidentDate: Date,
  documents: [
    {
      fileName: String,
      fileUrl: String,
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  timeline: [
    {
      date: Date,
      status: String,
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      notes: String,
    },
  ],
  hearings: [
    {
      date: Date,
      title: String, // e.g., "Bail Hearing"
      location: String, // e.g., "High Court, Room 4"
      notes: String,
    },
  ],
  investigationNotes: [
    {
      note: String,
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      addedAt: {
        type: Date,
        default: Date.now,
    },
    },
  ],
  legalNotes: [
    {
      note: String,
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  judgment: {
    verdict: String,
    reasoning: String,
    sentence: String,
    givenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    givenAt: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Case', caseSchema);