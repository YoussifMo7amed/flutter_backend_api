import express from 'express';
import { uploadMedicalImage } from './medical-images.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import upload from '../../middlewares/upload.middleware.js';

const router = express.Router();

router.post('/', protect, upload.single('image'), uploadMedicalImage);

export default router;
