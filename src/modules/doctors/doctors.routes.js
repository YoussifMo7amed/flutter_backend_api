import express from 'express';
import { getAvailableSlots, searchDoctors } from './doctors.controller.js';

const router = express.Router();

router.get('/:doctorId/available-slots', getAvailableSlots);
router.get('/Search', searchDoctors);

export default router;
