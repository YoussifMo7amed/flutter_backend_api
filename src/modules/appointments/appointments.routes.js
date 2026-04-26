import express from 'express';
import { 
  bookAppointment, 
  getMyAppointments, 
  updateAppointmentStatus,
  rescheduleAppointment,
  getAppointmentDetails 
} from './appointments.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', protect, bookAppointment); // POST /api/appointments
router.get('/patient', protect, getMyAppointments); // GET /api/appointments/patient
router.patch('/:id/status', protect, updateAppointmentStatus);
router.post('/:id/reschedule', protect, rescheduleAppointment);
router.get('/:id/details', protect, getAppointmentDetails);

export default router;
