import express from 'express';
import { getMedicalRecords } from './medical-records.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/patient', protect, getMedicalRecords);

export default router;
