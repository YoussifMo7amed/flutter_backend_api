import Notification from '../../models/Notification.js';
import DeviceToken from '../../models/DeviceToken.js';
import { getFirebaseAdmin } from '../../config/firebase.js';

export const sendPushNotification = async (userId, payload) => {
  const admin = getFirebaseAdmin();
  if (!admin) {
    console.log('[FCM] Firebase Admin not initialized, skipping push.');
    return;
  }

  try {
    const devices = await DeviceToken.find({ userId, isActive: true });
    if (!devices || devices.length === 0) {
      console.log(`[FCM] No active device tokens found for user ${userId}`);
      return;
    }

    const tokens = devices.map(d => d.token);

    const message = {
      notification: payload.notification,
      data: payload.data || {},
      tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errCode = resp.error?.code;
          if (
            errCode === 'messaging/invalid-registration-token' ||
            errCode === 'messaging/registration-token-not-registered'
          ) {
            failedTokens.push(tokens[idx]);
          }
          console.error(`[FCM] Token failure: ${errCode} for token ${tokens[idx]}`);
        }
      });
      
      // Cleanup invalid tokens
      if (failedTokens.length > 0) {
        await DeviceToken.updateMany(
          { token: { $in: failedTokens } },
          { isActive: false }
        );
        console.log(`[FCM] Deactivated ${failedTokens.length} invalid tokens.`);
      }
    }
  } catch (error) {
    console.error('[FCM] Error sending push notification:', error);
  }
};

export const createNotification = async (userId, title, message, type, metadata = null) => {
  // 1. Save to DB
  const notificationDoc = await Notification.create({
    userId,
    title,
    message,
    type,
    metadata: metadata ? JSON.stringify(metadata) : null
  });

  // 2. Prepare payload string values (FCM data map only accepts strings)
  const dataPayload = {
    notificationId: notificationDoc._id.toString(),
    type: type || 'general',
  };

  if (metadata) {
    if (metadata.appointmentId) dataPayload.appointmentId = metadata.appointmentId.toString();
    if (metadata.prescriptionId) dataPayload.prescriptionId = metadata.prescriptionId.toString();
  }

  // 3. Dispatch Push Notification
  await sendPushNotification(userId, {
    notification: {
      title,
      body: message
    },
    data: dataPayload
  });

  return notificationDoc;
};
