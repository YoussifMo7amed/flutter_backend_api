import Notification from '../../models/Notification.js';

export const createNotification = async (userId, title, message, type, metadata = null) => {
  return await Notification.create({
    userId,
    title,
    message,
    type,
    metadata: metadata ? JSON.stringify(metadata) : null
  });
};
