import Payment from '../../models/Payment.js';
import Appointment from '../../models/Appointment.js';
import Doctor from '../../models/Doctor.js';
import { sendResponse } from '../../utils/response.js';
import { createNotification } from '../notifications/notifications.service.js';

export const initiatePayment = async (req, res) => {
  const { appointmentId, provider } = req.body;

  try {
    const appointment = await Appointment.findById(appointmentId).populate('doctorId');
    if (!appointment) {
      return sendResponse(res, 404, 'Appointment not found');
    }

    // Prevent paying twice for the same appointment
    const existingSuccess = await Payment.findOne({ appointmentId, status: 'success' });
    if (existingSuccess) {
      return sendResponse(res, 409, 'This appointment is already paid');
    }

    const amount = appointment.doctorId?.consultationFee || 0;

    const payment = await Payment.create({
      userId: req.user._id,
      appointmentId,
      amount,
      provider,
      status: 'pending',
      currency: 'EGP'
    });

    // Mocking a provider URL
    const paymentUrl = `https://payment-provider.com/checkout/${payment._id}`;

    return sendResponse(res, 200, 'Payment initiated', {
      paymentUrl,
      providerRef: payment._id.toString()
    });
  } catch (error) {
    return sendResponse(res, 400, error.message);
  }
};

export const updatePaymentStatus = async (req, res) => {
  const { paymentId } = req.params;
  const { status, providerRef } = req.body;

  try {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return sendResponse(res, 404, 'Payment not found');
    }

    // Only owner can update
    if (payment.userId.toString() !== req.user._id.toString()) {
      return sendResponse(res, 401, 'Not authorized');
    }

    if (payment.status === 'success') {
      return sendResponse(res, 400, 'Payment already successful');
    }

    payment.status = status;
    if (providerRef) payment.providerRef = providerRef;

    if (status === 'success') {
      payment.paidAt = new Date();
      // Confirm the appointment
      await Appointment.findByIdAndUpdate(payment.appointmentId, { status: 'confirmed' });

      // Trigger Notification
      await createNotification(
        payment.userId,
        'Payment Successful',
        'Your payment has been completed successfully.',
        'payment',
        { appointmentId: payment.appointmentId }
      );
    }

    await payment.save();

    return sendResponse(res, 200, 'Payment updated', null);
  } catch (error) {
    return sendResponse(res, 400, error.message);
  }
};

export const getMyPayments = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const totalItems = await Payment.countDocuments({ userId: req.user._id });
    const payments = await Payment.find({ userId: req.user._id })
      .populate({
        path: 'appointmentId',
        populate: {
          path: 'doctorId',
          populate: { path: 'userId', select: 'fullName' }
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const formatted = payments.map(p => ({
      id: p._id.toString(),
      amount: p.amount,
      status: p.status,
      currency: p.currency,
      createdAt: p.createdAt,
      paidAt: p.paidAt || null,
      appointment: {
        doctorName: p.appointmentId?.doctorId?.userId?.fullName || 'Unknown',
        appointmentType: 'Consultation' // Static for now
      }
    }));

    return sendResponse(res, 200, 'Payments fetched', {
      payments: formatted,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit)
      }
    });
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};
