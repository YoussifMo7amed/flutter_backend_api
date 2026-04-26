import MedicalImage from '../../models/MedicalImage.js';
import Appointment from '../../models/Appointment.js';
import { sendResponse } from '../../utils/response.js';

export const uploadMedicalImage = async (req, res) => {
  const { appointmentId, description, isCritical } = req.body;
  if (!req.file) return sendResponse(res, 400, 'No file uploaded');

  try {
    const medicalImage = await MedicalImage.create({
      appointmentId,
      patientId: req.user._id,
      fileName: req.file.filename,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      description,
      isCritical: isCritical === 'true',
      viewerUrl: `/uploads/medical-images/${req.file.filename}`
    });

    if (appointmentId) {
      await Appointment.findByIdAndUpdate(appointmentId, {
        $push: { medicalImages: medicalImage._id }
      });
    }

    return sendResponse(res, 200, 'Image uploaded successfully', null);
  } catch (error) {
    return sendResponse(res, 400, error.message);
  }
};
