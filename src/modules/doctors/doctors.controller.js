import Doctor from '../../models/Doctor.js';
import Specialty from '../../models/Specialty.js';
import Appointment from '../../models/Appointment.js';
import User from '../../models/User.js';
import { sendResponse } from '../../utils/response.js';

export const getAvailableSlots = async (req, res) => {
  const { doctorId } = req.params;
  const { date } = req.query; // YYYY-MM-DD

  try {
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return sendResponse(res, 404, 'Doctor not found');

    // Mocking logic for available slots
    // In a real app, you would check working hours and existing appointments
    const slots = [];
    const startHour = parseInt(doctor.workingTimeStart?.split(':')[0] || 9);
    const endHour = parseInt(doctor.workingTimeEnd?.split(':')[0] || 17);

    for (let h = startHour; h < endHour; h++) {
      for (let m = 0; m < 60; m += 30) {
        const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
        const dateTime = `${date}T${time}Z`;
        
        // Check if already booked
        const booked = await Appointment.findOne({
          doctorId,
          appointmentDate: date,
          timeSlot: time.substring(0, 5),
          status: { $ne: 'cancelled' }
        });

        if (!booked) {
          slots.push(dateTime);
        }
      }
    }

    const data = {
      doctorId,
      date,
      slotDuration: 30,
      buffer: 0,
      slots,
      isWorkingDay: true
    };

    return sendResponse(res, 200, 'Available slots', data);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

export const searchDoctors = async (req, res) => {
  const { query, specialtyId, sort, page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    const filter = {};
    if (specialtyId) filter.specialtyId = specialtyId;

    let users = [];
    if (query) {
      users = await User.find({
        role: 'Doctor',
        fullName: { $regex: query, $options: 'i' }
      }).select('_id');
      const userIds = users.map(u => u._id);
      filter.userId = { $in: userIds };
    }

    const totalItems = await Doctor.countDocuments(filter);
    const doctorsData = await Doctor.find(filter)
      .populate('userId', 'fullName imageUrl')
      .populate('specialtyId')
      .skip(skip)
      .limit(parseInt(limit));

    const formattedDoctors = doctorsData.map(doc => ({
      id: doc._id.toString(),
      fullName: doc.userId?.fullName || 'Doctor',
      specialty: {
        id: doc.specialtyId?._id.toString(),
        name: doc.specialtyId?.name,
        description: doc.specialtyId?.description,
        imageUrl: doc.specialtyId?.imageUrl
      },
      imageUrl: doc.userId?.imageUrl || '',
      consultationFee: doc.consultationFee,
      address: doc.address || '',
      workingTime: `${doc.workingTimeStart || ''} - ${doc.workingTimeEnd || ''}`,
      qualifications: doc.qualifications || '',
      licenseNumber: doc.licenseNumber || ''
    }));

    return sendResponse(res, 200, `Found ${totalItems} doctors`, {
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      },
      doctors: formattedDoctors
    });
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};
