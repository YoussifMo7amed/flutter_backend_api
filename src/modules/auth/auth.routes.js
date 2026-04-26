import express from 'express';
import { 
  register, 
  login, 
  sendOtp, 
  verifyOtp, 
  resetPassword, 
  completeProfile, 
  uploadImage 
} from './auth.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';
import upload from '../../middlewares/upload.middleware.js';

const router = express.Router();

router.post('/Register', register);
router.post('/Login', login);
router.post('/Otp/send', sendOtp);
router.post('/Otp/verify', verifyOtp);
router.post('/PasswordReset/reset-password', resetPassword);
router.post('/CompleteProfile/complete', protect, completeProfile);

export default router;
