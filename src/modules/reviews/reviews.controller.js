import Review from '../../models/Review.js';
import Appointment from '../../models/Appointment.js';
import Doctor from '../../models/Doctor.js';
import { sendResponse } from '../../utils/response.js';

const formatReviewModel = (rev) => ({
  id: rev._id.toString(),
  doctorId: rev.doctorId?.toString(),
  doctorName: rev.doctorId?.userId?.fullName,
  patientId: rev.userId?._id?.toString(),
  patientName: rev.userId?.fullName || 'User',
  patientImage: rev.userId?.imageUrl || null,
  appointmentId: rev.appointmentId?.toString(),
  appointmentDate: rev.appointmentId?.scheduledStart,
  rating: rev.rating,
  comment: rev.comment,
  createdAt: rev.createdAt,
  updatedAt: rev.updatedAt
});

export const addReview = async (req, res) => {
  const { appointmentId, rating, comment } = req.body;

  try {
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return sendResponse(res, 404, 'Appointment not found');

    if (appointment.status !== 'completed') {
      return sendResponse(res, 400, 'You can only review a doctor after a completed appointment');
    }

    const review = await Review.create({
      userId: req.user._id,
      doctorId: appointment.doctorId,
      appointmentId,
      rating,
      comment
    });

    return sendResponse(res, 201, 'Review added successfully', formatReviewModel(review));
  } catch (error) {
    if (error.code === 11000) return sendResponse(res, 409, 'You have already reviewed this appointment');
    return sendResponse(res, 400, error.message);
  }
};

export const getDoctorReviews = async (req, res) => {
  const { doctorId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const skip = (page - 1) * pageSize;

  try {
    const totalItems = await Review.countDocuments({ doctorId });
    const reviews = await Review.find({ doctorId })
      .populate({
        path: 'userId',
        select: 'fullName imageUrl'
      })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'fullName' }
      })
      .populate('appointmentId', 'scheduledStart')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    const formattedReviews = reviews.map(formatReviewModel);

    return sendResponse(res, 200, 'Reviews fetched successfully', {
      data: formattedReviews,
      page,
      limit: pageSize,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize),
      hasPreviousPage: page > 1,
      hasNextPage: page < Math.ceil(totalItems / pageSize)
    });
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

export const getMyReviewForAppointment = async (req, res) => {
  const { appointmentId } = req.params;
  try {
    const review = await Review.findOne({ appointmentId, userId: req.user._id })
      .populate('userId', 'fullName imageUrl')
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'fullName' }
      })
      .populate('appointmentId', 'scheduledStart');
    
    if (!review) return sendResponse(res, 404, 'No review found for this appointment');
    return sendResponse(res, 200, 'Review found', formatReviewModel(review));
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

export const updateReview = async (req, res) => {
  const { reviewId } = req.params;
  const { rating, comment } = req.body;
  try {
    const review = await Review.findOneAndUpdate(
      { _id: reviewId, userId: req.user._id },
      { rating, comment },
      { new: true }
    );
    if (!review) return sendResponse(res, 404, 'Review not found');
    return sendResponse(res, 200, 'Review updated', formatReviewModel(review));
  } catch (error) {
    return sendResponse(res, 400, error.message);
  }
};

export const deleteReview = async (req, res) => {
  const { reviewId } = req.params;
  try {
    const result = await Review.findOneAndDelete({ _id: reviewId, userId: req.user._id });
    if (!result) return sendResponse(res, 404, 'Review not found');
    return sendResponse(res, 200, 'Review deleted successfully', 'Success');
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};
