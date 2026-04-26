import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../../models/User.js';
import Patient from '../../models/Patient.js';
import Otp from '../../models/Otp.js';
import { sendResponse } from '../../utils/response.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const formatUserResponse = (user) => {
  return {
    id: user._id.toString(),
    fullName: user.fullName || null,
    email: user.email,
    role: user.role,
    isVerified: user.isVerified,
    isCompletedProfile: user.isCompletedProfile
  };
};

export const register = async (req, res) => {
  const { email, phoneNumber, password, role, fullName } = req.body;

  try {
    const userExists = await User.findOne({ $or: [{ email }, { phoneNumber }] });
    if (userExists) {
      return sendResponse(res, 409, 'User with this email or phone already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      email,
      phoneNumber,
      passwordHash,
      role: role || 'Patient',
      fullName,
      isVerified: false,
      isCompletedProfile: false
    });

    if (user) {
      return sendResponse(res, 201, 'Registration successful', {
        token: generateToken(user._id),
        user: formatUserResponse(user)
      });
    }
  } catch (error) {
    return sendResponse(res, 400, error.message);
  }
};

export const login = async (req, res) => {
  const { emailOrPhone, password } = req.body;

  try {
    const user = await User.findOne({
      $or: [{ email: emailOrPhone }, { phoneNumber: emailOrPhone }]
    });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      user.lastLoginAt = new Date();
      await user.save();

      return sendResponse(res, 200, 'Login successful', {
        token: generateToken(user._id),
        user: formatUserResponse(user)
      });
    } else {
      return sendResponse(res, 401, 'Invalid email/phone or password');
    }
  } catch (error) {
    return sendResponse(res, 400, error.message);
  }
};

export const sendOtp = async (req, res) => {
  const { email, isForgetPass } = req.body;
  // Mocking OTP sending
  const otpCode = '123456'; 
  const salt = await bcrypt.genSalt(10);
  const otpHash = await bcrypt.hash(otpCode, salt);

  await Otp.create({
    email,
    otpHash,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
    purpose: isForgetPass ? 'reset' : 'verify'
  });

  console.log(`OTP for ${email}: ${otpCode}`);
  return sendResponse(res, 200, 'OTP sent successfully (Check console for mock code)');
};

export const verifyOtp = async (req, res) => {
  const { email, otpCode, isForgetPass } = req.body;
  
  const otpEntry = await Otp.findOne({ 
    email, 
    purpose: isForgetPass ? 'reset' : 'verify',
    isUsed: false 
  }).sort({ createdAt: -1 });

  if (!otpEntry || otpEntry.expiresAt < new Date()) {
    return sendResponse(res, 400, 'Invalid or expired OTP');
  }

  const isMatch = await bcrypt.compare(otpCode, otpEntry.otpHash);
  if (!isMatch) {
    return sendResponse(res, 400, 'Invalid OTP code');
  }

  otpEntry.isUsed = true;
  await otpEntry.save();

  if (!isForgetPass) {
    await User.findOneAndUpdate({ email }, { isVerified: true });
  }

  return sendResponse(res, 200, 'OTP verified successfully');
};

export const resetPassword = async (req, res) => {
  const { email, newPassword, confirmPassword } = req.body;
  if (newPassword !== confirmPassword) {
    return sendResponse(res, 400, 'Passwords do not match');
  }

  const user = await User.findOne({ email });
  if (!user) return sendResponse(res, 404, 'User not found');

  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(newPassword, salt);
  await user.save();

  return sendResponse(res, 200, 'Password reset successful');
};

export const completeProfile = async (req, res) => {
  const { birthDate, gender, address, bloodType } = req.body;

  try {
    let patient = await Patient.findOne({ userId: req.user._id });
    if (patient) {
      patient.birthDate = birthDate;
      patient.gender = gender;
      patient.address = address;
      patient.bloodType = bloodType;
      await patient.save();
    } else {
      await Patient.create({
        userId: req.user._id,
        birthDate,
        gender,
        address,
        bloodType
      });
    }

    req.user.isCompletedProfile = true;
    await req.user.save();

    return sendResponse(res, 200, 'Profile completed successfully', formatUserResponse(req.user));
  } catch (error) {
    return sendResponse(res, 400, error.message);
  }
};

export const uploadImage = async (req, res) => {
  if (!req.file) {
    return sendResponse(res, 400, 'No image uploaded');
  }

  const imageUrl = `/uploads/${req.file.filename}`;
  req.user.imageUrl = imageUrl;
  await req.user.save();

  return sendResponse(res, 200, 'Image uploaded successfully', { imageUrl });
};
