import express from 'express';
import { 
  bookAppointment, 
  getMyAppointments, 
  updateAppointmentStatus,
  cancelAppointment,
  rescheduleAppointment,
  getActiveAppointmentByDoctor, getAppointmentDetails 
} from './appointments.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', protect, bookAppointment);
router.get('/patient', protect, getMyAppointments);
router.patch('/:id/status', protect, updateAppointmentStatus);
router.patch('/:id/cancel', protect, cancelAppointment);
router.patch('/:id/reschedule', protect, rescheduleAppointment);
router.get('/:id/details', protect, getActiveAppointmentByDoctor, getAppointmentDetails);
router.get('/active/:doctorId', protect, getActiveAppointmentByDoctor);

export default router;
