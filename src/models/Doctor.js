import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  specialtyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Specialty', required: true },
  consultationFee: { type: Number, default: 0 },
  address: { type: String },
  workingDays: [{ type: String }],
  workingTimeStart: { type: String }, // e.g., "09:00"
  workingTimeEnd: { type: String },   // e.g., "17:00"
  qualifications: { type: String },
  licenseNumber: { type: String },
}, { timestamps: true });

doctorSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Doctor = mongoose.model('Doctor', doctorSchema);
export default Doctor;
