import express from 'express';
import { getAvailableSlots, searchDoctors, updateSchedule } from './doctors.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.patch('/schedule', protect, updateSchedule);
router.get('/:doctorId/available-slots', getAvailableSlots);
router.get('/Search', searchDoctors);

export default router;
