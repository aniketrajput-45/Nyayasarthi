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
    enum: ['complaint', 'fir_filed', 'pending_lawyer', 'filed', 'under-investigation', 'in-court', 'resolved'], 
    default: 'complaint',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },

  
  // --- AI INTEGRATION FIELDS ---
  bnsSection: { type: String, default: null },
  aiSuggestedEvidence: [{ type: String }],
  requiresLawyerReview: { type: Boolean, default: false },

  // --- PRIVACY & AID OPTIONS ---
  isProBono: { type: Boolean, default: false },
  isAnonymous: { type: Boolean, default: false },
  shareWithLegalAid: { type: Boolean, default: false },
  
  // --- BNSS TIMELINE MANAGEMENT ---
  // Changed to optional so the middleware can calculate it automatically if missing
  deadlineDate: { 
    type: Date, 
    required: false 
  },

  location: String,
  incidentDate: Date,
  
  // --- ROLE-BASED ASSIGNMENTS ---
  filedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedPolice: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedLawyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  interestedLawyers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  assignedJudge: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // --- UPDATED DOCUMENTS ARRAY (FOR VERIFICATION) ---
  documents: [
    {
      fileName: String,
      fileUrl: String,
      uploadedAt: { type: Date, default: Date.now },
      // NEW: Needed for the verify/reject feature to work
      verificationStatus: { 
        type: String, 
        enum: ['pending', 'verified', 'rejected'], 
        default: 'pending' 
      },
      verifiedAt: Date,
      fileHash: { type: String, default: null },
      deviceMetadata: { type: String, default: null },
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

// --- AUTOMATED DEADLINE FEATURE ---
// This calculates the deadline automatically before saving if one isn't provided
caseSchema.pre('save', function(next) {
  if (!this.deadlineDate) {
    const timelineRules = {
      civil: 90,
      criminal: 60,
      cyber: 45,
      corporate: 120,
      commercial: 90,
      family: 60,
      property: 90,
      other: 60
    };
    
    const daysToSolve = timelineRules[this.type] || 60; 
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + daysToSolve);
    this.deadlineDate = deadline;
  }
  next();
});

export default mongoose.model('Case', caseSchema);