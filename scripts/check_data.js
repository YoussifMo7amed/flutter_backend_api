import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Specialty from '../src/models/Specialty.js';
import Doctor from '../src/models/Doctor.js';

dotenv.config();

const check = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const specs = await Specialty.find();
  const docs = await Doctor.find().populate('specialtyId');
  console.log('Specialties found:', specs.length);
  specs.forEach(s => console.log(' -', s.name));
  console.log('Doctors found:', docs.length);
  docs.forEach(d => console.log(' -', d.licenseNumber, 'in', d.specialtyId?.name));
  process.exit();
};
check();
