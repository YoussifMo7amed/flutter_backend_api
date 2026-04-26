import Prescription from '../../models/Prescription.js';
import { sendResponse } from '../../utils/response.js';

export const getPrescriptions = async (req, res) => {
  try {
    const prescriptions = await Prescription.find({ patientId: req.user._id })
      .populate('appointmentId')
      .populate({ path: 'doctorId', populate: { path: 'userId', select: 'fullName' } });
    
    return sendResponse(res, 200, 'Prescriptions fetched', prescriptions);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};
