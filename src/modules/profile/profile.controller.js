import User from '../../models/User.js';
import Patient from '../../models/Patient.js';
import { sendResponse } from '../../utils/response.js';

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const patient = await Patient.findOne({ userId: req.user._id });

    if (!user) {
      return sendResponse(res, 404, 'User not found');
    }

    const profileData = {
      id: user._id.toString(),
      fullName: user.fullName || '',
      email: user.email,
      phone: user.phoneNumber || '',
      imageUrl: user.imageUrl || null,
      role: user.role,
      birthDate: patient ? patient.birthDate : '',
      gender: patient ? patient.gender : '',
      address: patient ? patient.address : '',
      bloodType: patient ? patient.bloodType : '',
      emergencyContact: patient ? patient.emergencyContact : null,
      openmrsPatientUuid: patient ? patient.openmrsPatientUuid : null,
    };

    return sendResponse(res, 200, 'Profile found', profileData);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

export const updateProfile = async (req, res) => {
  const { 
    fullName, phone, birthDate, gender, address, 
    bloodType, emergencyContact 
  } = req.body;

  try {
    const user = await User.findById(req.user._id);
    if (!user) return sendResponse(res, 404, 'User not found');

    if (fullName) user.fullName = fullName;
    if (phone) user.phoneNumber = phone;
    await user.save();

    let patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      patient = new Patient({ userId: req.user._id });
    }

    if (birthDate) patient.birthDate = birthDate;
    if (gender) patient.gender = gender;
    if (address) patient.address = address;
    if (bloodType) patient.bloodType = bloodType;
    if (emergencyContact) patient.emergencyContact = emergencyContact;

    await patient.save();

    user.isCompletedProfile = true;
    await user.save();

    // Return flattened profile
    const profileData = {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      phone: user.phoneNumber,
      imageUrl: user.imageUrl,
      role: user.role,
      birthDate: patient.birthDate,
      gender: patient.gender,
      address: patient.address,
      bloodType: patient.bloodType,
      emergencyContact: patient.emergencyContact,
      openmrsPatientUuid: patient.openmrsPatientUuid,
    };

    return sendResponse(res, 200, 'Profile updated successfully', profileData);
  } catch (error) {
    return sendResponse(res, 400, error.message);
  }
};
