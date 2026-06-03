import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { notFound, errorHandler } from './middlewares/error.middleware.js';
import authRoutes from './modules/auth/auth.routes.js';
import specialtyRoutes from './modules/specialties/specialties.routes.js';
import appointmentRoutes from './modules/appointments/appointments.routes.js';
import paymentRoutes from './modules/payments/payments.routes.js';
import notificationRoutes from './modules/notifications/notifications.routes.js';
import deviceTokenRoutes from './modules/device-tokens/device-tokens.routes.js';
import reviewRoutes from './modules/reviews/reviews.routes.js';
import profileRoutes from './modules/profile/profile.routes.js';
import medicalRecordRoutes from './modules/medical-records/medical-records.routes.js';
import prescriptionRoutes from './modules/prescriptions/prescriptions.routes.js';
import communicationRoutes from './modules/communication/communication.routes.js';
import medicalImageRoutes from './modules/medical-images/medical-images.routes.js';
import doctorRoutes from './modules/doctors/doctors.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Serve static files from uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ code: 200, status: 'UP', message: 'Server is healthy' });
});

// Mounting routes to match ApiConstants EXACTLY
app.use('/api', authRoutes); // Login, Register, Otp, PasswordReset, CompleteProfile
app.use('/api/Specialties', specialtyRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/Notifications', notificationRoutes);
app.use('/api/device-tokens', deviceTokenRoutes);
app.use('/api/doctor-reviews', reviewRoutes);
app.use('/api/Profile_Management', profileRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/Admin', adminRoutes);
app.use('/api/records', medicalRecordRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/medical-images', medicalImageRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

export default app;
