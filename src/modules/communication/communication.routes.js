import express from 'express';
import { 
  createSession, 
  getSessionByAppointment, 
  closeSession,
  getCallToken 
} from './communication.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/sessions', protect, createSession);
router.get('/sessions/:appointmentId', protect, getSessionByAppointment);
router.put('/sessions/:sessionId/close', protect, closeSession);
router.get('/call-token/:appointmentId', protect, getCallToken);

export default router;
