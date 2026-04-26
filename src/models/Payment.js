import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'success', 'failed', 'cancelled'], 
    default: 'pending' 
  },
  provider: { type: String, required: true },
  providerRef: { type: String },
  currency: { type: String, default: 'EGP' },
  paidAt: { type: Date },
}, { timestamps: true });

paymentSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
