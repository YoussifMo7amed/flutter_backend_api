import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:3000/api';
let token = '';
let userId = '';
let specialtyId = '';
let doctorId = '';
let appointmentId = '';
let paymentId = '';

const log = (step, success, data = null) => {
  console.log(`[${success ? 'SUCCESS' : 'FAILED'}] ${step}`);
  if (data) console.log('Response:', JSON.stringify(data, null, 2).substring(0, 300) + '...');
};

const runTests = async () => {
  try {
    console.log('--- STARTING FULL API TEST ---');

    // 0. Fetch initial data from API
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
      console.error('CRITICAL: Could not find specialty or doctor via API. Make sure database is seeded and server is connected.');
      process.exit(1);
    }

    // 1. AUTH: Register
    const regRes = await fetch(`${BASE_URL}/Register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test_${Date.now()}@test.com`,
        phoneNumber: `phone_${Date.now()}`,
        password: 'password123',
        role: 'Patient',
        fullName: 'Test Patient'
      })
    });
    const regData = await regRes.json();
    log('Register User', regRes.ok, regData);

    // 2. AUTH: Login
    const loginRes = await fetch(`${BASE_URL}/Login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrPhone: regData.data.user.email,
        password: 'password123'
      })
    });
    const loginData = await loginRes.json();
    token = loginData.data.token;
    userId = loginData.data.user.id;
    log('Login User', loginRes.ok, loginData);

    const headers = { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 3. SPECIALTIES: Get All
    const specRes = await fetch(`${BASE_URL}/Specialties`);
    log('Get Specialties', specRes.ok, await specRes.json());

    // 4. DOCTORS: Get by Specialty
    const docListRes = await fetch(`${BASE_URL}/Specialties/${specialtyId}/doctors`);
    log('Get Doctors by Specialty', docListRes.ok, await docListRes.json());

    // 5. DOCTORS: Get Details
    const docDetailRes = await fetch(`${BASE_URL}/Specialties/doctors/${doctorId}`);
    log('Get Doctor Details', docDetailRes.ok, await docDetailRes.json());

    // 6. APPOINTMENTS: Book
    const bookRes = await fetch(`${BASE_URL}/Appointments/book`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        doctorId,
        appointmentDate: '2026-12-01',
        timeSlot: '14:00'
      })
    });
    const bookData = await bookRes.json();
    appointmentId = bookData.data.id;
    log('Book Appointment', bookRes.ok, bookData);

    // 7. PAYMENTS: Initiate
    const payInitRes = await fetch(`${BASE_URL}/payments/initiate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ appointmentId, provider: 'paymob' })
    });
    const payInitData = await payInitRes.json();
    paymentId = payInitData.data.providerRef;
    log('Initiate Payment', payInitRes.ok, payInitData);

    // 8. PAYMENTS: Update Status (Success)
    const payStatusRes = await fetch(`${BASE_URL}/payments/${paymentId}/status`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status: 'success', providerRef: 'MOCK_TXN_123' })
    });
    log('Update Payment Status to Success', payStatusRes.ok, await payStatusRes.json());

    // 9. APPOINTMENTS: Verify status is confirmed
    const myAppRes = await fetch(`${BASE_URL}/Appointments/my?status=confirmed`, { headers });
    log('Verify Appointment Status Confirmed', myAppRes.ok, await myAppRes.json());

    // 10. NOTIFICATIONS: Register Token
    const tokenRes = await fetch(`${BASE_URL}/device-tokens/register`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ token: 'test_token', deviceType: 'ios', deviceName: 'iPhone 13' })
    });
    log('Register Device Token', tokenRes.ok, await tokenRes.json());

    // 11. NOTIFICATIONS: Get Notifications
    const notifRes = await fetch(`${BASE_URL}/Notifications`, { headers });
    log('Get Notifications', notifRes.ok, await notifRes.json());

    // 12. REVIEWS (Skipped in automation as it requires 'completed' status)
    console.log('[INFO] Skipping Add Review test (requires manual appointment completion)');

    // 13. REVIEWS: Get Doctor Reviews
    const getReviewRes = await fetch(`${BASE_URL}/reviews/doctor/${doctorId}`);
    log('Get Doctor Reviews', getReviewRes.ok, await getReviewRes.json());

    console.log('\n--- ALL TESTS COMPLETED ---');
    process.exit(0);
  } catch (error) {
    console.error('CRITICAL ERROR DURING TESTING:', error);
    process.exit(1);
  }
};

runTests();
