import MedicalRecord from '../../models/MedicalRecord.js';
import Diagnosis from '../../models/Diagnosis.js';
import Appointment from '../../models/Appointment.js';
import Doctor from '../../models/Doctor.js';
import Prescription from '../../models/Prescription.js';
import { sendResponse } from '../../utils/response.js';
import { createNotification } from '../notifications/notifications.service.js';

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

export const createMedicalRecord = async (req, res) => {
  if (req.user.role !== 'Doctor') {
    return sendResponse(res, 403, 'Only doctors can create medical records');
  }

  const { appointmentId, title, description, icdCode, severity, medications } = req.body;

  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return sendResponse(res, 404, 'Doctor profile not found');
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return sendResponse(res, 404, 'Appointment not found');
    }

    if (appointment.doctorId.toString() !== doctor._id.toString()) {
      return sendResponse(res, 403, 'You are not authorized to update this appointment');
    }

    if (appointment.status !== 'confirmed') {
      return sendResponse(res, 400, 'Only confirmed appointments can be completed');
    }

    // 1. Create Medical Record
    const record = await MedicalRecord.create({
      userId: appointment.userId,
      title: title || 'Clinical Consultation',
      recordType: 'Consultation',
    });

    // 2. Create Diagnosis
    const diagnosis = await Diagnosis.create({
      medicalRecordId: record._id,
      appointmentId: appointment._id,
      diagnosedBy: req.user._id,
      description,
      icdCode: icdCode || 'General',
      severity: severity || 'moderate',
    });

    // 3. Create Prescription if medications exist
    let prescription = null;
    if (medications && Array.isArray(medications) && medications.length > 0) {
      prescription = await Prescription.create({
        diagnosisId: diagnosis._id,
        patientId: appointment.userId,
        doctorId: doctor._id,
        appointmentId: appointment._id,
        medications,
      });
    }

    // 4. Update Appointment
    appointment.medicalRecordId = record._id;
    appointment.diagnoses.push(diagnosis._id);
    if (prescription) {
      appointment.prescriptions.push(prescription._id);
    }
    appointment.status = 'completed';
    await appointment.save();

    // 5. Notify Patient
    await createNotification(
      appointment.userId,
      'Consultation Completed',
      'Your doctor has completed the consultation and added a new medical record.',
      'medical_record',
      { appointmentId: appointment._id }
    );

    return sendResponse(res, 201, 'Medical record created and appointment completed', {
      medicalRecordId: record._id,
      diagnosisId: diagnosis._id,
      prescriptionId: prescription ? prescription._id : null
    });
  } catch (error) {
    return sendResponse(res, 400, error.message);
  }
};
