import mongoose from 'mongoose';
import User from './src/models/User.js';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    let user = await User.findOne();
    if (user) {
      user.role = 'Admin';
      await user.save();
      console.log('Promoted user', user.email, 'to Admin');
    } else {
      console.log('No user found to promote.');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
