import express from 'express';
import { getProfile, updateProfile } from './profile.controller.js';
import { uploadImage } from '../auth/auth.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import upload from '../../middlewares/upload.middleware.js';

const router = express.Router();

// Match Flutter path: Profile_Management
router.get('/', protect, getProfile);
router.put('/update', protect, updateProfile);
router.post('/image', protect, upload.single('image'), uploadImage);

export default router;
