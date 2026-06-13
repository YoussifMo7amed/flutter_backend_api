import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import Models
import User from '../src/models/User.js';
import Patient from '../src/models/Patient.js';
import Doctor from '../src/models/Doctor.js';
import Specialty from '../src/models/Specialty.js';
import DiseaseMapping from '../src/models/DiseaseMapping.js';
import Appointment from '../src/models/Appointment.js';
import Payment from '../src/models/Payment.js';
import MedicalRecord from '../src/models/MedicalRecord.js';
import Diagnosis from '../src/models/Diagnosis.js';
import Prescription from '../src/models/Prescription.js';
import AIAnalysis from '../src/models/AIAnalysis.js';
import Notification from '../src/models/Notification.js';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const importData = async () => {
  try {
    await connectDB();

    console.log('Clearing old data safely...');
    await User.deleteMany();
    await Patient.deleteMany();
    await Doctor.deleteMany();
    await Specialty.deleteMany();
    await DiseaseMapping.deleteMany();
    await Appointment.deleteMany();
    await Payment.deleteMany();
    await MedicalRecord.deleteMany();
    await Diagnosis.deleteMany();
    await Prescription.deleteMany();
    await AIAnalysis.deleteMany();
    await Notification.deleteMany();

    const passwordHash = await bcrypt.hash('12345678', 10);

    console.log('Creating Admin...');
    await User.create({
      fullName: 'MedMind Admin',
      email: 'admin@medmind.com',
      phoneNumber: '01000000000',
      passwordHash,
      role: 'Admin',
      isVerified: true,
      isCompletedProfile: true,
      imageUrl: 'https://ui-avatars.com/api/?name=Admin+User&background=random'
    });

    console.log('Creating Specialties...');
    const specialtiesData = [
      { name: 'Cardiology', description: 'Heart and blood vessel diseases.', imageUrl: 'https://cdn-icons-png.flaticon.com/512/3004/3004458.png' },
      { name: 'Dermatology', description: 'Skin, hair, and nail conditions.', imageUrl: 'https://cdn-icons-png.flaticon.com/512/3209/3209142.png' },
      { name: 'Neurology', description: 'Brain and nervous system disorders.', imageUrl: 'https://cdn-icons-png.flaticon.com/512/2860/2860959.png' },
      { name: 'Orthopedics', description: 'Bone and joint conditions.', imageUrl: 'https://cdn-icons-png.flaticon.com/512/3209/3209180.png' },
      { name: 'Pediatrics', description: 'Child and infant healthcare.', imageUrl: 'https://cdn-icons-png.flaticon.com/512/3209/3209152.png' },
      { name: 'Psychiatry', description: 'Mental health and behavioral disorders.', imageUrl: 'https://cdn-icons-png.flaticon.com/512/2860/2860965.png' },
      { name: 'General Medicine', description: 'Primary care and general health.', imageUrl: 'https://cdn-icons-png.flaticon.com/512/2966/2966327.png' }
    ];
    const createdSpecialties = await Specialty.insertMany(specialtiesData);
    
    const getSpecId = (name) => createdSpecialties.find(s => s.name === name)._id;

    console.log('Creating Disease Mappings...');
    await DiseaseMapping.insertMany([
      { diseaseName: 'Acne', normalizedName: 'acne', specialty: getSpecId('Dermatology'), aliases: ['pimples', 'breakouts'] },
      { diseaseName: 'Melanoma', normalizedName: 'melanoma', specialty: getSpecId('Dermatology'), aliases: ['mel'] },
      { diseaseName: 'Brain Tumor', normalizedName: 'brain tumor', specialty: getSpecId('Neurology'), aliases: ['glioma', 'meningioma', 'pituitary'] },
      { diseaseName: 'Migraine', normalizedName: 'migraine', specialty: getSpecId('Neurology'), aliases: ['severe headache', 'headache'] },
      { diseaseName: 'Hypertension', normalizedName: 'hypertension', specialty: getSpecId('Cardiology'), aliases: ['high blood pressure', 'heart problems'] },
      { diseaseName: 'Heart Disease', normalizedName: 'heart disease', specialty: getSpecId('Cardiology'), aliases: ['cardiac arrest'] },
      { diseaseName: 'Flu', normalizedName: 'flu', specialty: getSpecId('General Medicine'), aliases: ['influenza', 'fever', 'common cold'] },
      { diseaseName: 'Skin Disease', normalizedName: 'skin disease', specialty: getSpecId('Dermatology'), aliases: ['rash'] }
    ]);

    console.log('Creating 35 Approved Doctors & 3 Pending Doctors...');
    // Base names to construct 35 doctors
    const firstNames = ['Ahmed', 'Mohamed', 'Sara', 'Mariam', 'Omar', 'Khaled', 'Nour', 'Fatima', 'Youssef', 'Hassan', 'Mona', 'Tarek', 'Yasmin', 'Kareem', 'Amira'];
    const lastNames = ['Hassan', 'Ali', 'Ibrahim', 'Adel', 'Khaled', 'Mostafa', 'Riad', 'Osama', 'Sami', 'Nabil', 'Fouad', 'Kamal', 'Mahmoud'];
    
    let docCounter = 1;
    const createdDoctors = [];
    
    for (const spec of specialtiesData) {
      for (let i = 0; i < 5; i++) {
        const name = `Dr. ${firstNames[docCounter % firstNames.length]} ${lastNames[docCounter % lastNames.length]}`;
        
        const user = await User.create({
          fullName: name,
          email: `doctor${docCounter}@medmind.com`,
          phoneNumber: `010${docCounter.toString().padStart(8, '0')}`,
          passwordHash,
          role: 'Doctor',
          isVerified: true,
          isCompletedProfile: true,
          imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
        });

        const doctor = await Doctor.create({
          userId: user._id,
          specialtyId: getSpecId(spec.name),
          consultationFee: 300 + Math.floor(Math.random() * 200),
          address: '123 Medical Center, Cairo, Egypt',
          workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Sunday'],
          workingTimeStart: '09:00',
          workingTimeEnd: '17:00',
          slotDuration: 30,
          qualifications: 'MD, PhD',
          licenseNumber: 'LIC-' + Math.floor(10000 + Math.random() * 90000),
          isApproved: true
        });
        createdDoctors.push({ user, doctor, spec: spec.name });
        docCounter++;
      }
    }

    // 3 Unapproved Doctors
    for (let i = 0; i < 3; i++) {
      const name = `Dr. Unapproved ${i+1}`;
      const user = await User.create({
        fullName: name,
        email: `pending${i+1}@medmind.com`,
        phoneNumber: `012${i.toString().padStart(8, '0')}`,
        passwordHash,
        role: 'Doctor',
        isVerified: true,
        isCompletedProfile: true,
        imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
      });

      await Doctor.create({
        userId: user._id,
        specialtyId: getSpecId('General Medicine'),
        consultationFee: 200,
        address: 'Pending Clinic',
        workingDays: ['Monday'],
        workingTimeStart: '10:00',
        workingTimeEnd: '12:00',
        slotDuration: 30,
        qualifications: 'MBBS',
        licenseNumber: 'LIC-PENDING-' + i,
        isApproved: false
      });
    }

    console.log('Creating 10 Patients...');
    const patientNames = [
      'Ali Hassan', 'Fatima Ahmed', 'Mahmoud Saad', 'Yasmin Adel', 'Tarek Mounir',
      'Salma Youssef', 'Hussein Kamal', 'Rana Nabil', 'Sherif Fouad', 'Dina Sami'
    ];

    const createdPatients = [];
    for (let i = 0; i < patientNames.length; i++) {
      const user = await User.create({
        fullName: patientNames[i],
        email: `patient${i+1}@medmind.com`,
        phoneNumber: `011${i.toString().padStart(8, '0')}`,
        passwordHash,
        role: 'Patient',
        isVerified: true,
        isCompletedProfile: true,
        imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(patientNames[i])}&background=random`
      });

      const patient = await Patient.create({
        userId: user._id,
        birthDate: '1990-01-01',
        gender: i % 2 === 0 ? 'Male' : 'Female',
        address: 'Cairo, Egypt',
        bloodType: 'O+'
      });
      createdPatients.push({ user, patient });
    }

    console.log('Creating AI Analysis History...');
    const patient1 = createdPatients[0].user;
    const patient2 = createdPatients[1].user;
    
    await AIAnalysis.create([
      {
        userId: patient1._id,
        type: 'symptoms',
        input: 'I have a very severe headache and blurry vision.',
        prediction: 'Migraine',
        confidence: 0.92,
        riskLevel: 'moderate',
        recommendation: 'Please rest in a dark room and consult a Neurologist.',
        explanation: 'The combination of severe headache and blurry vision is highly indicative of a migraine with aura.',
        suggestedSpecialty: getSpecId('Neurology')
      },
      {
        userId: patient2._id,
        type: 'skin',
        input: '/demo/skin_lesion.jpg',
        prediction: 'Melanoma',
        confidence: 0.88,
        riskLevel: 'high',
        recommendation: 'Immediate dermatological assessment required.',
        explanation: 'Model detected irregular borders and coloration.',
        suggestedSpecialty: getSpecId('Dermatology')
      }
    ]);

    console.log('Creating Appointments & Medical Records...');
    
    const docNeuro = createdDoctors.find(d => d.spec === 'Neurology');
    const docDerm = createdDoctors.find(d => d.spec === 'Dermatology');

    // 1. Pending Appointment
    await Appointment.create({
      userId: patient1._id,
      doctorId: docNeuro.doctor._id,
      scheduledStart: new Date(Date.now() + 86400000), // Tomorrow
      scheduledEnd: new Date(Date.now() + 86400000 + 1800000),
      appointmentDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      timeSlot: '10:00',
      reason: 'Frequent migraines',
      appointmentType: 'video',
      price: docNeuro.doctor.consultationFee,
      status: 'pending'
    });

    // 2. Confirmed Appointment (Paid)
    const confirmedAppt = await Appointment.create({
      userId: patient2._id,
      doctorId: docDerm.doctor._id,
      scheduledStart: new Date(Date.now() + 172800000), // Day after tomorrow
      scheduledEnd: new Date(Date.now() + 172800000 + 1800000),
      appointmentDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
      timeSlot: '11:00',
      reason: 'Suspicious mole check',
      appointmentType: 'video',
      price: docDerm.doctor.consultationFee,
      status: 'confirmed'
    });

    await Payment.create({
      userId: patient2._id,
      appointmentId: confirmedAppt._id,
      amount: confirmedAppt.price,
      status: 'success',
      provider: 'stripe',
      providerRef: 'pi_demo_123',
      currency: 'EGP',
      paidAt: new Date()
    });

    // 3. Completed Appointment
    const completedAppt = await Appointment.create({
      userId: patient1._id,
      doctorId: docNeuro.doctor._id,
      scheduledStart: new Date(Date.now() - 86400000), // Yesterday
      scheduledEnd: new Date(Date.now() - 86400000 + 1800000),
      appointmentDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      timeSlot: '14:00',
      reason: 'Initial consultation',
      appointmentType: 'video',
      price: docNeuro.doctor.consultationFee,
      status: 'completed'
    });

    await Payment.create({
      userId: patient1._id,
      appointmentId: completedAppt._id,
      amount: completedAppt.price,
      status: 'success',
      provider: 'stripe',
      providerRef: 'pi_demo_456',
      currency: 'EGP',
      paidAt: new Date(Date.now() - 86400000)
    });

    const medicalRecord = await MedicalRecord.create({
      userId: patient1._id,
      title: 'Neurology Consultation',
      recordType: 'Consultation',
      recordDate: new Date(Date.now() - 86400000)
    });

    const diagnosis = await Diagnosis.create({
      medicalRecordId: medicalRecord._id,
      appointmentId: completedAppt._id,
      diagnosedBy: docNeuro.user._id,
      description: 'Patient suffers from chronic migraines with aura.',
      icdCode: 'G43.909',
      severity: 'moderate'
    });

    const prescription = await Prescription.create({
      diagnosisId: diagnosis._id,
      patientId: patient1._id,
      doctorId: docNeuro.doctor._id,
      appointmentId: completedAppt._id,
      medications: [
        {
          drugName: 'Sumatriptan',
          dosage: '50mg',
          frequency: 'As needed',
          instructions: 'Take one tablet at the onset of a migraine.',
          durationDays: 30
        }
      ]
    });

    completedAppt.medicalRecordId = medicalRecord._id;
    completedAppt.diagnoses.push(diagnosis._id);
    completedAppt.prescriptions.push(prescription._id);
    await completedAppt.save();

    console.log('Creating Notifications...');
    await Notification.create([
      {
        userId: docDerm.user._id,
        title: 'New Appointment',
        message: 'You have a new confirmed appointment with Fatima Ahmed.',
        type: 'appointment',
        metadata: JSON.stringify({ appointmentId: confirmedAppt._id })
      },
      {
        userId: patient1._id,
        title: 'Consultation Completed',
        message: 'Dr. Mona El-Sayed has added a new medical record.',
        type: 'medical_record',
        metadata: JSON.stringify({ appointmentId: completedAppt._id })
      }
    ]);

    console.log('Demo Data Seeded Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

importData();