import mongoose from 'mongoose';

const caseSchema = new mongoose.Schema({
  caseNumber: { type: String, unique: true, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: {
    type: String,
    enum: ['civil', 'criminal', 'commercial', 'family', 'property', 'other'],
    required: true,
  },
  filedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedPolice: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedLawyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedJudge: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['filed', 'under-investigation', 'in-court', 'resolved'],
    default: 'filed',
  },
}, { timestamps: true });

// This prevents the "Identifier 'Case' has already been declared" error
const Case = mongoose.models.Case || mongoose.model('Case', caseSchema);
export default Case;