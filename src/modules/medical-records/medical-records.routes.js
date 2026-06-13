import express from 'express';
import { getMedicalRecords, createMedicalRecord } from './medical-records.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/patient', protect, getMedicalRecords);
router.post('/', protect, createMedicalRecord);

export default router;
