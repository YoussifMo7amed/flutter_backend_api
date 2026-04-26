import DeviceToken from '../../models/DeviceToken.js';
import { sendResponse } from '../../utils/response.js';

export const registerToken = async (req, res) => {
  const { token, deviceType, deviceName } = req.body;

  if (!token) {
    return sendResponse(res, 400, 'Token is required');
  }

  try {
    // Check if token already exists
    let deviceToken = await DeviceToken.findOne({ token });

    if (deviceToken) {
      // Reassign or update
      deviceToken.userId = req.user._id;
      deviceToken.deviceType = deviceType || deviceToken.deviceType;
      deviceToken.deviceName = deviceName || deviceToken.deviceName;
      deviceToken.isActive = true;
      await deviceToken.save();
    } else {
      // Create new
      await DeviceToken.create({
        userId: req.user._id,
        token,
        deviceType,
        deviceName,
        isActive: true
      });
    }

    return sendResponse(res, 200, 'Device token registered successfully', null);
  } catch (error) {
    return sendResponse(res, 400, error.message);
  }
};

export const unregisterToken = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return sendResponse(res, 400, 'Token is required');
  }

  try {
    const deviceToken = await DeviceToken.findOne({ token, userId: req.user._id });
    if (!deviceToken) {
      return sendResponse(res, 404, 'Token not found for this user');
    }

    await DeviceToken.deleteOne({ token, userId: req.user._id });

    return sendResponse(res, 200, 'Device token unregistered successfully', null);
  } catch (error) {
    return sendResponse(res, 400, error.message);
  }
};
