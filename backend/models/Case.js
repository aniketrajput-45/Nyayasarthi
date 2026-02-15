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
    enum: ['civil', 'criminal', 'commercial', 'family', 'property', 'cyber', 'corporate', 'other'],
    required: true,
  },
  status: {
    type: String,
    // --- FIX IS HERE: ADD 'pending_lawyer' TO THIS LIST ---
    enum: ['pending_lawyer', 'filed', 'under-investigation', 'in-court', 'resolved'], 
    default: 'pending_lawyer', // Change default to pending_lawyer
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },

  // --- NEW FIELDS ---
  isProBono: { type: Boolean, default: false },
  isAnonymous: { type: Boolean, default: false },
  shareWithLegalAid: { type: Boolean, default: false },
  
  deadlineDate: { 
    type: Date, 
    required: true 
  },

  location: String,
  incidentDate: Date,
  
  filedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedPolice: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedLawyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedJudge: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  documents: [
    {
      fileName: String,
      fileUrl: String,
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
  
  timeline: [
    {
      date: Date,
      status: String,
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      notes: String,
    },
  ],
  
  hearings: [
    {
      date: Date,
      title: String,
      location: String,
      notes: String,
    }
  ],
  
  investigationNotes: [
    {
      note: String,
      addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      addedAt: { type: Date, default: Date.now },
    },
  ],
  
  legalNotes: [
    {
      note: String,
      addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      addedAt: { type: Date, default: Date.now },
    },
  ],
  
  judgment: {
    verdict: String,
    reasoning: String,
    sentence: String,
    givenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    givenAt: Date,
  },


}, { timestamps: true });

export default mongoose.model('Case', caseSchema);