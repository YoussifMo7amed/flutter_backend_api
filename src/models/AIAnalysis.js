import mongoose from 'mongoose';

const aiAnalysisSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['skin', 'brain', 'symptoms'], 
    required: true 
  },
  input: { type: String, required: true }, // Image URL/path OR symptom text
  prediction: { type: String, required: true },
  confidence: { type: Number },
  riskLevel: { type: String },
  recommendation: { type: String },
  explanation: { type: String },
  suggestedSpecialty: { type: mongoose.Schema.Types.ObjectId, ref: 'Specialty' },
}, { timestamps: true });

aiAnalysisSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const AIAnalysis = mongoose.model('AIAnalysis', aiAnalysisSchema);
export default AIAnalysis;
