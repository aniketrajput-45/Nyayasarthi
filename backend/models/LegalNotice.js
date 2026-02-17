import mongoose from 'mongoose';

const legalNoticeSchema = new mongoose.Schema({
  noticeNumber: {
    type: String,
    unique: true,
    // not required – auto-generated in pre('validate') from form submission
  },
  noticeType: {
    type: String,
    enum: ['cease_and_desist', 'demand', 'eviction', 'termination', 'breach', 'defamation', 'recovery', 'other'],
    required: true,
  },
  urgency: {
    type: String,
    enum: ['normal', 'urgent', 'critical'],
    default: 'normal',
  },
  subject: {
    type: String,
    required: true,
  },
  
  // Case reference (optional)
  caseNumber: {
    type: String,
    default: '',
  },
  // Incident Details (for matching with citizen cases)
  incidentTitle: {
    type: String,
    required: true,
  },
  caseType: {
    type: String,
    enum: ['civil', 'criminal', 'commercial', 'family', 'property', 'cyber', 'corporate', 'other'],
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  dateOfIncident: {
    type: Date,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  noticeDate: {
    type: Date,
    required: true,
    default: Date.now,
  },
  
  // Issuer Information
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  issuerRole: {
    type: String,
    enum: ['judge', 'lawyer', 'police'],
    required: true,
  },
  issuerName: {
    type: String,
    required: true,
  },
  
  // Status Tracking
  status: {
    type: String,
    enum: ['issued', 'delivered', 'acknowledged', 'responded', 'expired'],
    default: 'issued',
  },
  
  // Response Tracking
  responseReceived: {
    type: Boolean,
    default: false,
  },
  responseDate: {
    type: Date,
    default: null,
  },
  responseDetails: {
    type: String,
    default: '',
  },
  
  // Timeline
  timeline: [
    {
      date: Date,
      status: String,
      notes: String,
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
  ],
  
  // Attachments (if needed in future)
  attachments: [
    {
      fileName: String,
      fileUrl: String,
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
}, { timestamps: true });

// Generate notice number before validation (Mongoose validates before pre('save'), so we need pre('validate'))
legalNoticeSchema.pre('validate', async function(next) {
  if (!this.noticeNumber) {
    const count = await mongoose.model('LegalNotice').countDocuments();
    const year = new Date().getFullYear();
    this.noticeNumber = `NOTICE-${year}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

legalNoticeSchema.pre('save', async function(next) {
  // Initialize timeline if empty (only add updatedBy if issuedBy exists)
  if (!this.timeline || this.timeline.length === 0) {
    this.timeline = [{
      date: new Date(),
      status: 'issued',
      notes: `Legal notice issued by ${this.issuerName || 'System'} (${this.issuerRole || 'N/A'})`,
      updatedBy: this.issuedBy || undefined,
    }];
  }
  next();
});

export default mongoose.model('LegalNotice', legalNoticeSchema);
