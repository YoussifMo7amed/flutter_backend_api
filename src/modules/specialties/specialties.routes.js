import express from 'express';
import { 
  getAllSpecialties, 
  getDoctorsBySpecialty, 
  getDoctorById 
} from './specialties.controller.js';

const router = express.Router();

router.get('/', getAllSpecialties);
router.get('/:specialtyId/doctors', getDoctorsBySpecialty);
router.get('/doctors/:doctorId', getDoctorById);

export default router;
