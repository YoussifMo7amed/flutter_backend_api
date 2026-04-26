import mongoose from 'mongoose';

const communicationSessionSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  type: { type: String, enum: ['chat', 'video', 'call'], required: true },
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
  expiresAt: { type: Date, required: true },
  startedAt: { type: Date, default: Date.now },
}, { timestamps: true });

communicationSessionSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.sessionId = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const CommunicationSession = mongoose.model('CommunicationSession', communicationSessionSchema);
export default CommunicationSession;
