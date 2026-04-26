import express from 'express';
import { 
  initiatePayment, 
  updatePaymentStatus, 
  getMyPayments 
} from './payments.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/initiate', protect, initiatePayment);
router.put('/:paymentId/status', protect, updatePaymentStatus);
router.get('/my', protect, getMyPayments);

export default router;
