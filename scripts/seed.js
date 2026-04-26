import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../src/models/User.js';
import Specialty from '../src/models/Specialty.js';
import Doctor from '../src/models/Doctor.js';

dotenv.config();

const specialtiesData = [
  { name: 'Cardiology', description: 'Heart and blood vessel specialists', imageUrl: 'https://cdn-icons-png.flaticon.com/512/3004/3004458.png' },
  { name: 'Dermatology', description: 'Skin, hair, and nail specialists', imageUrl: 'https://cdn-icons-png.flaticon.com/512/2814/2814316.png' },
  { name: 'Neurology', description: 'Brain and nervous system specialists', imageUrl: 'https://cdn-icons-png.flaticon.com/512/2301/2301134.png' },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await Specialty.deleteMany({});
    await Doctor.deleteMany({});
    // We keep users to avoid breaking auth, but we'll create specific doctor users
    await User.deleteMany({ role: 'Doctor' });

    // Insert Specialties
    const createdSpecialties = await Specialty.insertMany(specialtiesData);
    console.log('Specialties seeded.');

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    const doctorsInfo = [
      { fullName: 'Dr. Alice Heart', email: 'alice@heart.com', specialty: 'Cardiology' },
      { fullName: 'Dr. Bob Skin', email: 'bob@skin.com', specialty: 'Dermatology' },
      { fullName: 'Dr. Charlie Brain', email: 'charlie@brain.com', specialty: 'Neurology' },
      { fullName: 'Dr. Diana Pulse', email: 'diana@heart.com', specialty: 'Cardiology' },
      { fullName: 'Dr. Edward Nerve', email: 'edward@brain.com', specialty: 'Neurology' },
    ];

    for (let i = 0; i < doctorsInfo.length; i++) {
      const info = doctorsInfo[i];
      
      // Create User
      const user = await User.create({
        fullName: info.fullName,
        email: info.email,
        phoneNumber: `12345678${i}`,
        passwordHash,
        role: 'Doctor',
        isVerified: true,
        isCompletedProfile: true
      });

      // Find Specialty ID
      const spec = createdSpecialties.find(s => s.name === info.specialty);

      // Create Doctor
      await Doctor.create({
        userId: user._id,
        specialtyId: spec._id,
        consultationFee: 100 + (i * 20),
        address: `${100 + i} Medical Center St, City`,
        workingDays: ['Monday', 'Wednesday', 'Friday'],
        workingTimeStart: '09:00',
        workingTimeEnd: '17:00',
        qualifications: 'MD, PhD with 10+ years experience',
        licenseNumber: `LIC-00${i}`
      });
    }

    console.log('Doctors and associated Users seeded.');
    process.exit();
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seed();
