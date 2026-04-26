import Appointment from '../../models/Appointment.js';
import Doctor from '../../models/Doctor.js';
import Specialty from '../../models/Specialty.js';
import User from '../../models/User.js';
import Patient from '../../models/Patient.js';
import MedicalRecord from '../../models/MedicalRecord.js';
import Diagnosis from '../../models/Diagnosis.js';
import Prescription from '../../models/Prescription.js';
import MedicalImage from '../../models/MedicalImage.js';
import { sendResponse } from '../../utils/response.js';

const formatDoctorModel = async (doctorId) => {
  const doc = await Doctor.findById(doctorId).populate('userId').populate('specialtyId');
  if (!doc) return null;
  return {
    id: doc._id.toString(),
    doctorName: doc.userId?.fullName || 'Doctor',
    specialtyName: doc.specialtyId?.name || 'General',
    consultationFee: doc.consultationFee,
    image: doc.userId?.imageUrl || '',
    address: doc.address || '',
    workingTime: `${doc.workingTimeStart || ''} - ${doc.workingTimeEnd || ''}`
  };
};

const formatPatientModel = async (userId) => {
  const user = await User.findById(userId);
  const patient = await Patient.findOne({ userId });
  if (!user) return null;
  
  // Calculate age
  let age = 0;
  if (patient && patient.birthDate) {
    const birth = new Date(patient.birthDate);
    const today = new Date();
    age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
  }

  return {
    id: user._id.toString(),
    name: user.fullName || '',
    image: user.imageUrl || '',
    gender: patient ? patient.gender : 'Unknown',
    age
  };
};

export const bookAppointment = async (req, res) => {
  const { doctorId, appointmentDate, appointmentTime, reason, appointmentType, paymentMethod } = req.body;

  try {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return sendResponse(res, 404, 'Doctor not found');

    const scheduledStart = new Date(`${appointmentDate}T${appointmentTime}Z`);
    const scheduledEnd = new Date(scheduledStart.getTime() + 30 * 60 * 1000); // 30 mins later

    const appointment = await Appointment.create({
      userId: req.user._id,
      doctorId,
      scheduledStart,
      scheduledEnd,
      appointmentDate,
      timeSlot: appointmentTime.substring(0, 5),
      reason,
      appointmentType,
      price: doctor.consultationFee,
      status: 'pending'
    });

    const patientModel = await formatPatientModel(req.user._id);
    const doctorModel = await formatDoctorModel(doctorId);

    const data = {
      appointment: {
        id: appointment._id.toString(),
        appointmentDate: scheduledStart,
        appointmentTime: appointmentTime,
        status: appointment.status,
        reason: appointment.reason,
        appointmentType: appointment.appointmentType,
        createdAt: appointment.createdAt,
        patient: patientModel,
        doctor: doctorModel
      }
    };

    return sendResponse(res, 200, 'Appointment booked successfully', data);
  } catch (error) {
    return sendResponse(res, 400, error.message);
  }
};

export const getMyAppointments = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const totalItems = await Appointment.countDocuments({ userId: req.user._id });
    const appointments = await Appointment.find({ userId: req.user._id })
      .sort({ scheduledStart: 1 })
      .skip(skip)
      .limit(limit);

    const formatted = await Promise.all(appointments.map(async (app) => {
      const doctorModel = await formatDoctorModel(app.doctorId);
      return {
        id: app._id.toString(),
        appointmentDate: app.scheduledStart,
        appointmentTime: app.timeSlot,
        reason: app.reason,
        status: app.status,
        createdAt: app.createdAt,
        doctor: doctorModel
      };
    }));

    return sendResponse(res, 200, 'Appointments fetched successfully', {
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      },
      appointments: formatted
    });
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

export const updateAppointmentStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const appointment = await Appointment.findByIdAndUpdate(id, { status }, { new: true });
    if (!appointment) return sendResponse(res, 404, 'Appointment not found');
    return sendResponse(res, 200, 'Appointment status updated', null);
  } catch (error) {
    return sendResponse(res, 400, error.message);
  }
};

export const rescheduleAppointment = async (req, res) => {
  const { id } = req.params;
  const { appointmentDate, appointmentTime } = req.body;

  try {
    const scheduledStart = new Date(`${appointmentDate}T${appointmentTime}Z`);
    const scheduledEnd = new Date(scheduledStart.getTime() + 30 * 60 * 1000);

    const appointment = await Appointment.findByIdAndUpdate(id, {
      scheduledStart,
      scheduledEnd,
      appointmentDate,
      timeSlot: appointmentTime.substring(0, 5),
      status: 'rescheduled'
    }, { new: true });

    if (!appointment) return sendResponse(res, 404, 'Appointment not found');
    return sendResponse(res, 200, 'Appointment rescheduled successfully', null);
  } catch (error) {
    return sendResponse(res, 400, error.message);
  }
};

export const getAppointmentDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const app = await Appointment.findById(id)
      .populate('userId')
      .populate({
        path: 'doctorId',
        populate: [{ path: 'userId' }, { path: 'specialtyId' }]
      })
      .populate('medicalRecordId')
      .populate({
        path: 'diagnoses',
        populate: { path: 'diagnosedBy', select: 'fullName' }
      })
      .populate('prescriptions')
      .populate('medicalImages');

    if (!app) return sendResponse(res, 404, 'Appointment not found');

    const patient = await Patient.findOne({ userId: app.userId._id });
    
    // Calculate age
    let age = 0;
    if (patient && patient.birthDate) {
      const birth = new Date(patient.birthDate);
      const today = new Date();
      age = today.getFullYear() - birth.getFullYear();
    }

    const data = {
      id: app._id.toString(),
      scheduledStart: app.scheduledStart,
      scheduledEnd: app.scheduledEnd,
      status: app.status,
      reason: app.reason,
      appointmentType: app.appointmentType,
      price: app.price,
      doctorId: app.doctorId._id.toString(),
      doctorUserId: app.doctorId.userId._id.toString(),
      doctorName: app.doctorId.userId.fullName,
      doctorImage: app.doctorId.userId.imageUrl || '',
      specialty: app.doctorId.specialtyId.name,
      patientId: patient ? patient._id.toString() : '',
      patientUserId: app.userId._id.toString(),
      patientName: app.userId.fullName,
      patientImage: app.userId.imageUrl || '',
      patientPhone: app.userId.phoneNumber || '',
      patientGender: patient ? patient.gender : 'Unknown',
      patientAge: age,
      medicalRecord: app.medicalRecordId ? {
        id: app.medicalRecordId._id.toString(),
        title: app.medicalRecordId.title,
        recordType: app.medicalRecordId.recordType,
        recordDate: app.medicalRecordId.recordDate
      } : null,
      diagnoses: app.diagnoses.map(d => ({
        id: d._id.toString(),
        medicalRecordId: d.medicalRecordId.toString(),
        medicalRecordTitle: 'Record', // Needs more population if strictly required
        appointmentId: d.appointmentId?.toString(),
        diagnosedBy: d.diagnosedBy._id.toString(),
        doctorName: d.diagnosedBy.fullName,
        description: d.description,
        icdCode: d.icdCode,
        severity: d.severity,
        openmrsConditionUuid: d.openmrsConditionUuid,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt
      })),
      prescriptions: app.prescriptions.map(p => ({
        id: p._id.toString(),
        diagnosisId: p.diagnosisId.toString(),
        patientId: p.patientId.toString(),
        doctorId: p.doctorId.toString(),
        appointmentId: p.appointmentId.toString(),
        notes: p.notes,
        medications: p.medications.map(m => ({
          id: m._id.toString(),
          drugName: m.drugName,
          dosage: m.dosage,
          frequency: m.frequency,
          instructions: m.instructions,
          durationDays: m.durationDays
        }))
      })),
      medicalImages: app.medicalImages.map(img => ({
        id: img._id.toString(),
        appointmentId: img.appointmentId?.toString(),
        patientId: img.patientId.toString(),
        doctorId: img.doctorId?.toString(),
        requestedByRole: img.requestedByRole,
        fileName: img.fileName,
        fileType: img.fileType,
        fileSize: img.fileSize,
        description: img.description,
        tags: img.tags,
        doctorNotes: img.doctorNotes,
        isCritical: img.isCritical,
        status: img.status,
        pacsRefId: img.pacsRefId,
        studyInstanceUid: img.studyInstanceUid,
        modality: img.modality,
        studyDate: img.studyDate,
        isSyncedToPacs: img.isSyncedToPacs,
        viewerUrl: img.viewerUrl,
        uploadedByRole: img.uploadedByRole,
        createdAt: img.createdAt
      })),
      createdAt: app.createdAt,
      updatedAt: app.updatedAt
    };

    return sendResponse(res, 200, 'Appointment details retrieved successfully', data);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};
