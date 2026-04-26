import MedicalRecord from '../../models/MedicalRecord.js';
import Diagnosis from '../../models/Diagnosis.js';
import { sendResponse } from '../../utils/response.js';

export const getMedicalRecords = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const totalItems = await MedicalRecord.countDocuments({ userId: req.user._id });
    const records = await MedicalRecord.find({ userId: req.user._id })
      .sort({ recordDate: -1 })
      .skip(skip)
      .limit(limit);

    const formattedRecords = await Promise.all(records.map(async (rec) => {
      const diagnoses = await Diagnosis.find({ medicalRecordId: rec._id }).populate({
        path: 'diagnosedBy',
        select: 'fullName'
      });
      return {
        id: rec._id.toString(),
        title: rec.title,
        recordType: rec.recordType,
        recordedAt: rec.recordDate,
        diagnoses: diagnoses.map(d => ({
          id: d._id.toString(),
          medicalRecordId: d.medicalRecordId.toString(),
          appointmentId: d.appointmentId?.toString(),
          description: d.description,
          icdCode: d.icdCode,
          severity: d.severity,
          doctorName: d.diagnosedBy?.fullName || 'Doctor',
          createdAt: d.createdAt
        }))
      };
    }));

    return sendResponse(res, 200, 'Medical records retrieved successfully', {
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      },
      records: formattedRecords
    });
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};
