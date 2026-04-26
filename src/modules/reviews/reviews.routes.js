import express from 'express';
import { 
  addReview, 
  getDoctorReviews, 
  getMyReviewForAppointment,
  updateReview,
  deleteReview
} from './reviews.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', protect, addReview);
router.get('/doctor/:doctorId', getDoctorReviews);
router.get('/appointment/:appointmentId/my-review', protect, getMyReviewForAppointment);
router.put('/:reviewId', protect, updateReview);
router.delete('/:reviewId', protect, deleteReview);

export default router;
