import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  birthDate: { type: String },
  gender: { type: String },
  address: { type: String },
  bloodType: { type: String },
  emergencyContact: { type: String },
  openmrsPatientUuid: { type: String },
}, { timestamps: true });

const Patient = mongoose.model('Patient', patientSchema);
export default Patient;
