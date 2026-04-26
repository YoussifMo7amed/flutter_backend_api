import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Appointment from '../src/models/Appointment.js';
import Specialty from '../src/models/Specialty.js';
import Doctor from '../src/models/Doctor.js';
import User from '../src/models/User.js';

dotenv.config();

const BASE_URL = 'http://localhost:3000/api';
let token = '';
let userId = '';
let specialtyId = '';
let doctorId = '';
let appointmentId = '';
let paymentId = '';
let sessionId = '';
let reviewId = '';
let notificationId = '';

const log = (step, success, data = null) => {
  console.log(`[${success ? 'SUCCESS' : 'FAILED'}] ${step}`);
  if (!success && data) {
    console.error('Error Details:', JSON.stringify(data, null, 2));
  }
};

const runTests = async () => {
  try {
    console.log('--- STARTING INTEGRATION TESTS ---');

    // 0. Seed basic data via API/DB
    const initialSpecRes = await fetch(`${BASE_URL}/Specialties`);
    const specData = await initialSpecRes.json();
    if (specData.data && specData.data.length > 0) {
      specialtyId = specData.data[0].id;
      const docListRes = await fetch(`${BASE_URL}/Specialties/${specialtyId}/doctors`);
      const docListData = await docListRes.json();
      if (docListData.data.doctors && docListData.data.doctors.length > 0) {
        doctorId = docListData.data.doctors[0].id;
      }
    }

    if (!specialtyId || !doctorId) {
      console.error('CRITICAL: Ensure seed data is present.');
      process.exit(1);
    }

    // 1. Auth: Register
    const email = `test_${Date.now()}@test.com`;
    const regRes = await fetch(`${BASE_URL}/Register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        phoneNumber: `010${Date.now().toString().slice(-8)}`,
        password: 'password123',
        role: 'Patient',
        fullName: 'Integration User'
      })
    });
    const regData = await regRes.json();
    log('Register', regRes.ok, regData);

    // 2. Auth: Login
    const loginRes = await fetch(`${BASE_URL}/Login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone: email, password: 'password123' })
    });
    const loginData = await loginRes.json();
    token = loginData.data?.token;
    log('Login', loginRes.ok, loginData);

    const headers = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 3. Profile: Complete Profile
    const compProfRes = await fetch(`${BASE_URL}/CompleteProfile/complete`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        birthDate: '1990-01-01',
        gender: 'Male',
        address: '123 Main St',
        bloodType: 'O+'
      })
    });
    log('Complete Profile', compProfRes.ok, await compProfRes.json());

    // 4. Profile: Update Profile
    const updateProfRes = await fetch(`${BASE_URL}/Profile_Management/update`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        address: '456 New St'
      })
    });
    log('Update Profile', updateProfRes.ok, await updateProfRes.json());

    // 5. Doctors: Search
    const searchRes = await fetch(`${BASE_URL}/doctors/Search?query=Doc`);
    log('Search Doctors', searchRes.ok, await searchRes.json());

    // 6. Doctors: Available Slots
    const slotsRes = await fetch(`${BASE_URL}/doctors/${doctorId}/available-slots?date=2026-12-01`);
    log('Available Slots', slotsRes.ok, await slotsRes.json());

    // 7. Appointments: Book
    const bookRes = await fetch(`${BASE_URL}/appointments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        doctorId,
        appointmentDate: '2026-12-01',
        appointmentTime: '10:00:00',
        reason: 'Checkup',
        appointmentType: 'offline',
        paymentMethod: 'cash'
      })
    });
    const bookData = await bookRes.json();
    appointmentId = bookData.data?.appointment?.id;
    log('Book Appointment', bookRes.ok, bookData);

    // 8. Appointments: Details
    const appDetailsRes = await fetch(`${BASE_URL}/appointments/${appointmentId}/details`, { headers });
    log('Appointment Details', appDetailsRes.ok, await appDetailsRes.json());

    // 9. Appointments: My Appointments
    const myAppRes = await fetch(`${BASE_URL}/appointments/patient`, { headers });
    log('My Appointments', myAppRes.ok, await myAppRes.json());

    // 10. Appointments: Reschedule
    const reschedRes = await fetch(`${BASE_URL}/appointments/${appointmentId}/reschedule`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        appointmentDate: '2026-12-02',
        appointmentTime: '11:00:00'
      })
    });
    log('Reschedule Appointment', reschedRes.ok, await reschedRes.json());

    // 11. Payments: Initiate
    const payInitRes = await fetch(`${BASE_URL}/payments/initiate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ appointmentId, provider: 'paymob' })
    });
    const payInitData = await payInitRes.json();
    paymentId = payInitData.data?.providerRef || payInitData.data?.id || (payInitData.data && payInitData.data.split('/').pop()); // Depending on implementation
    if(!paymentId && payInitData.data?.providerRef) paymentId = payInitData.data.providerRef;
    
    // In current implementation, providerRef is payment._id
    if (payInitData.data && payInitData.data.providerRef) {
        paymentId = payInitData.data.providerRef;
    }

    log('Initiate Payment', payInitRes.ok, payInitData);

    // 12. Payments: Update Status
    if (paymentId) {
      const payStatusRes = await fetch(`${BASE_URL}/payments/${paymentId}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: 'success', providerRef: 'TXN123' })
      });
      log('Update Payment Status', payStatusRes.ok, await payStatusRes.json());
    } else {
      log('Update Payment Status', false, 'Payment ID missing');
    }

    // 13. Payments: My Payments
    const myPaymentsRes = await fetch(`${BASE_URL}/payments/my`, { headers });
    log('My Payments', myPaymentsRes.ok, await myPaymentsRes.json());

    // 14. Notifications: Device Tokens
    const tokenRes = await fetch(`${BASE_URL}/device-tokens/register`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ token: 'test_token', deviceType: 'android', deviceName: 'Samsung' })
    });
    log('Register Device Token', tokenRes.ok, await tokenRes.json());

    // 15. Notifications: Get Notifications
    const notifsRes = await fetch(`${BASE_URL}/Notifications`, { headers });
    const notifsData = await notifsRes.json();
    if (notifsData.data?.data?.length > 0) notificationId = notifsData.data.data[0].id;
    log('Get Notifications', notifsRes.ok, notifsData);

    // 16. Notifications: Mark Read
    if (notificationId) {
      const readRes = await fetch(`${BASE_URL}/Notifications/${notificationId}/read`, {
        method: 'PUT',
        headers
      });
      log('Mark Notification Read', readRes.ok, await readRes.json());
    }

    // 17. Communication: Create Session
    const commRes = await fetch(`${BASE_URL}/communication/sessions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ appointmentId, type: 'video' })
    });
    const commData = await commRes.json();
    sessionId = commData.data?.sessionId || commData.data?.id;
    log('Create Communication Session', commRes.ok, commData);

    // 18. Communication: Close Session
    if (sessionId) {
      const closeRes = await fetch(`${BASE_URL}/communication/sessions/${sessionId}/close`, {
        method: 'PUT',
        headers
      });
      log('Close Communication Session', closeRes.ok, await closeRes.json());
    }

    // 19. Medical Records & Prescriptions
    const recordsRes = await fetch(`${BASE_URL}/records/patient`, { headers });
    log('Medical Records', recordsRes.ok, await recordsRes.json());

    const presRes = await fetch(`${BASE_URL}/prescriptions`, { headers });
    log('Prescriptions', presRes.ok, await presRes.json());

    // 20. Reviews (Requires completed appointment)
    await mongoose.connect(process.env.MONGO_URI);
    await Appointment.findByIdAndUpdate(appointmentId, { status: 'completed' });
    
    const revRes = await fetch(`${BASE_URL}/doctor-reviews`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ appointmentId, rating: 5, comment: 'Great!' })
    });
    const revData = await revRes.json();
    log('Add Review', revRes.ok, revData);

    const docRevRes = await fetch(`${BASE_URL}/doctor-reviews/doctor/${doctorId}`);
    log('Get Doctor Reviews', docRevRes.ok, await docRevRes.json());

    console.log('\n--- TESTS FINISHED ---');
    process.exit(0);

  } catch (error) {
    console.error('Test Execution Error:', error);
    process.exit(1);
  }
};

runTests();
