import CommunicationSession from '../../models/CommunicationSession.js';
import Doctor from '../../models/Doctor.js';

export const createCommunicationSessionForAppointment = async (appointment) => {
  if (!appointment) return null;

  try {
    // 1. Check if session already exists for this appointment
    const existingSession = await CommunicationSession.findOne({ 
      appointmentId: appointment._id, 
      status: 'active' 
    });

    if (existingSession) {
      return existingSession;
    }

    // 2. Get Doctor profile to find the doctor's userId
    const doctor = await Doctor.findById(appointment.doctorId);
    if (!doctor) {
      console.warn(`[Communication Service] Doctor not found for appointment ${appointment._id}`);
      return null;
    }

    // 3. Determine session type
    // Support chat + video/audio. If appointment type is 'video' or 'chat', use it, otherwise default to 'chat'
    const sessionType = ['video', 'chat', 'call'].includes(appointment.appointmentType) ? appointment.appointmentType : 'chat';
    
    // 4. Create new CommunicationSession
    const newSession = await CommunicationSession.create({
      appointmentId: appointment._id,
      type: sessionType,
      userIds: [appointment.userId, doctor.userId], // Include both Patient and Doctor User IDs
      status: 'active',
      // Expires 1 hour after the scheduled end of the appointment
      expiresAt: new Date(appointment.scheduledEnd.getTime() + 60 * 60 * 1000) 
    });

    return newSession;
  } catch (error) {
    console.error('[Communication Service] Error creating session:', error);
    throw error;
  }
};