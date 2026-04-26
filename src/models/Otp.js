import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otpHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  purpose: { type: String, enum: ['verify', 'reset'], required: true },
  isUsed: { type: Boolean, default: false },
}, { timestamps: true });

const Otp = mongoose.model('Otp', otpSchema);
export default Otp;
