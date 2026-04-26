import Specialty from '../../models/Specialty.js';
import Doctor from '../../models/Doctor.js';
import User from '../../models/User.js';
import { sendResponse } from '../../utils/response.js';

export const getAllSpecialties = async (req, res) => {
  try {
    const specialties = await Specialty.find();
    return sendResponse(res, 200, 'Specialties fetched successfully', specialties);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

export const getDoctorsBySpecialty = async (req, res) => {
  const { specialtyId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const specialty = await Specialty.findById(specialtyId);
    if (!specialty) {
      return sendResponse(res, 404, 'Specialty not found');
    }

    const totalItems = await Doctor.countDocuments({ specialtyId });
    const doctorsData = await Doctor.find({ specialtyId })
      .populate('userId', 'fullName imageUrl')
      .populate('specialtyId')
      .skip(skip)
      .limit(limit);

    const formattedDoctors = doctorsData.map(doc => ({
      id: doc._id.toString(),
      fullName: doc.userId?.fullName || 'Doctor',
      specialty: {
        id: doc.specialtyId?._id.toString(),
        name: doc.specialtyId?.name,
        description: doc.specialtyId?.description,
        imageUrl: doc.specialtyId?.imageUrl
      },
      imageUrl: doc.userId?.imageUrl || null,
      consultationFee: doc.consultationFee,
      address: doc.address || null,
      workingTime: `${doc.workingTimeStart || ''} - ${doc.workingTimeEnd || ''}`,
      qualifications: doc.qualifications || null,
      licenseNumber: doc.licenseNumber || null
    }));

    return sendResponse(res, 200, 'Doctors fetched successfully', {
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      },
      doctors: formattedDoctors
    });
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

export const getDoctorById = async (req, res) => {
  const { doctorId } = req.params;

  try {
    const doc = await Doctor.findById(doctorId)
      .populate('userId', 'fullName imageUrl phoneNumber')
      .populate('specialtyId', 'name');

    if (!doc) {
      return sendResponse(res, 404, 'Doctor not found');
    }

    const formattedDoctor = {
      id: doc._id.toString(),
      fullName: doc.userId?.fullName || 'Doctor',
      specialty: doc.specialtyId?.name || 'General',
      imageUrl: doc.userId?.imageUrl || null,
      consultationFee: doc.consultationFee,
      address: doc.address || null,
      workingTime: `${doc.workingTimeStart || ''} - ${doc.workingTimeEnd || ''}`,
      workingDays: doc.workingDays || [],
      qualifications: doc.qualifications || null,
      phoneNumber: doc.userId?.phoneNumber || null
    };

    return sendResponse(res, 200, 'Doctor details fetched successfully', formattedDoctor);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};
