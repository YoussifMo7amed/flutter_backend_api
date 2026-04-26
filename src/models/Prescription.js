import mongoose from 'mongoose';

const medicationSchema = new mongoose.Schema({
  drugName: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String, required: true },
  instructions: { type: String, required: true },
  durationDays: { type: Number, required: true },
});

const prescriptionSchema = new mongoose.Schema({
  diagnosisId: { type: mongoose.Schema.Types.ObjectId, ref: 'Diagnosis', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  notes: { type: String },
  medications: [medicationSchema],
}, { timestamps: true });

prescriptionSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Prescription = mongoose.model('Prescription', prescriptionSchema);
export default Prescription;
