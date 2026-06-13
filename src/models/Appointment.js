import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  scheduledStart: { type: Date, required: true },
  scheduledEnd: { type: Date, required: true },
  appointmentDate: { type: String, required: true }, // YYYY-MM-DD for display/filtering
  timeSlot: { type: String, required: true },       // HH:mm for display
  reason: { type: String, default: 'Consultation' },
  appointmentType: { type: String, enum: ['online', 'offline', 'video', 'chat'], default: 'offline' },
  price: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'completed','in_progress','cancelled', 'rescheduled'], 
    default: 'pending' 
  },
  medicalRecordId: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalRecord' },
  diagnoses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Diagnosis' }],
  prescriptions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' }],
  medicalImages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MedicalImage' }],
}, { timestamps: true });

appointmentSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;
