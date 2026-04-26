import mongoose from 'mongoose';

const medicalImageSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  requestedByRole: { type: String },
  fileName: { type: String, required: true },
  fileType: { type: String, required: true },
  fileSize: { type: Number, required: true },
  description: { type: String },
  tags: { type: String },
  doctorNotes: { type: String },
  isCritical: { type: Boolean, default: false },
  status: { type: String, default: 'uploaded' },
  pacsRefId: { type: String },
  studyInstanceUid: { type: String },
  modality: { type: String },
  studyDate: { type: Date },
  isSyncedToPacs: { type: Boolean, default: false },
  viewerUrl: { type: String, required: true },
  uploadedByRole: { type: String },
}, { timestamps: true });

medicalImageSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const MedicalImage = mongoose.model('MedicalImage', medicalImageSchema);
export default MedicalImage;
