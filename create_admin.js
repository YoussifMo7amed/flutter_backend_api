import mongoose from 'mongoose';
import User from './src/models/User.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    let user = await User.findOne({ email: 'admin@doctormate.com' });
    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('admin123', salt);
      user = new User({
        email: 'admin@doctormate.com',
        phoneNumber: '+1000000000',
        passwordHash,
        role: 'Admin',
        fullName: 'System Admin',
        isVerified: true,
        isCompletedProfile: true
      });
      await user.save();
      console.log('Created admin@doctormate.com with password admin123');
    } else {
      user.role = 'Admin';
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash('admin123', salt);
      await user.save();
      console.log('Updated admin@doctormate.com with password admin123');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
