import mongoose from 'mongoose';

const diagnosisSchema = new mongoose.Schema({
  medicalRecordId: { type: mongoose.Schema.Types.ObjectId, ref: 'MedicalRecord', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  diagnosedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Doctor User ID
  description: { type: String, required: true },
  icdCode: { type: String, required: true },
  severity: { type: String, enum: ['mild', 'moderate', 'severe'], required: true },
  openmrsConditionUuid: { type: String },
}, { timestamps: true });

diagnosisSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Diagnosis = mongoose.model('Diagnosis', diagnosisSchema);
export default Diagnosis;
