import Doctor from '../../models/Doctor.js';
import Specialty from '../../models/Specialty.js';
import Appointment from '../../models/Appointment.js';
import User from '../../models/User.js';
import { sendResponse } from '../../utils/response.js';

export const updateSchedule = async (req, res) => {
  if (req.user.role !== 'Doctor') {
    return sendResponse(res, 403, 'Only doctors can update schedule');
  }

  const { workingDays, workingTimeStart, workingTimeEnd, slotDuration } = req.body;

  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) return sendResponse(res, 404, 'Doctor profile not found');

    if (workingDays) doctor.workingDays = workingDays;
    if (workingTimeStart) doctor.workingTimeStart = workingTimeStart;
    if (workingTimeEnd) doctor.workingTimeEnd = workingTimeEnd;
    if (slotDuration) doctor.slotDuration = slotDuration;

    await doctor.save();
    return sendResponse(res, 200, 'Schedule updated successfully', doctor);
  } catch (error) {
    return sendResponse(res, 400, error.message);
  }
};

export const getAvailableSlots = async (req, res) => {
  const { doctorId } = req.params;
  const { date } = req.query; // YYYY-MM-DD

  if (!date) return sendResponse(res, 400, 'Date parameter is required');

  try {
    const doctor = await Doctor.findOne({ _id: doctorId, isApproved: true });
    if (!doctor) return sendResponse(res, 404, 'Doctor not found or not approved');

    const reqDate = new Date(date);
    const dayOfWeek = reqDate.toLocaleDateString('en-US', { weekday: 'long' });

    // Check if doctor works on this day
    const isWorkingDay = doctor.workingDays && doctor.workingDays.includes(dayOfWeek);

    if (!isWorkingDay) {
      return sendResponse(res, 200, 'Doctor does not work on this day', {
        doctorId, date, slotDuration: doctor.slotDuration || 30, buffer: 0, slots: [], isWorkingDay: false
      });
    }

    const slots = [];
    const startParts = (doctor.workingTimeStart || "09:00").split(':');
    const endParts = (doctor.workingTimeEnd || "17:00").split(':');
    
    let currentMins = parseInt(startParts[0]) * 60 + parseInt(startParts[1] || 0);
    const endMins = parseInt(endParts[0]) * 60 + parseInt(endParts[1] || 0);
    const duration = doctor.slotDuration || 30;

    const now = new Date();
    const isToday = now.toISOString().split('T')[0] === date;
    const currentMinsNow = now.getHours() * 60 + now.getMinutes();

    while (currentMins + duration <= endMins) {
      const h = Math.floor(currentMins / 60).toString().padStart(2, '0');
      const m = (currentMins % 60).toString().padStart(2, '0');
      const time = `${h}:${m}:00`;
      const timeSlotStr = `${h}:${m}`;
      const dateTime = `${date}T${time}Z`;

      // If today, skip past slots
      if (!isToday || currentMins > currentMinsNow) {
        // Check if already booked
        const booked = await Appointment.findOne({
          doctorId,
          appointmentDate: date,
          timeSlot: timeSlotStr,
          status: { $nin: ['cancelled', 'rescheduled'] }
        });

        if (!booked) {
          slots.push(dateTime);
        }
      }
      currentMins += duration;
    }

    const data = {
      doctorId,
      date,
      slotDuration: duration,
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
    // Only return approved doctors
    const filter = { isApproved: true };
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
