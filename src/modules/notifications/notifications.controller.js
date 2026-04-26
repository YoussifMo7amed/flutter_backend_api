import Notification from '../../models/Notification.js';
import { sendResponse } from '../../utils/response.js';

export const getNotifications = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const totalItems = await Notification.countDocuments({ userId: req.user._id });
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalItems / limit);

    return sendResponse(res, 200, 'Notifications fetched successfully', {
      data: notifications,
      page,
      limit,
      totalItems,
      totalPages,
      hasPreviousPage: page > 1,
      hasNextPage: page < totalPages
    });
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user._id, isRead: false });
    return sendResponse(res, 200, 'Unread count fetched successfully', { count });
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};

export const markAsRead = async (req, res) => {
  const { notificationId } = req.params;

  try {
    const notification = await Notification.findOne({ _id: notificationId, userId: req.user._id });
    if (!notification) {
      return sendResponse(res, 404, 'Notification not found');
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    return sendResponse(res, 200, 'Notification marked as read', null);
  } catch (error) {
    return sendResponse(res, 400, error.message);
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    return sendResponse(res, 200, 'All notifications marked as read', null);
  } catch (error) {
    return sendResponse(res, 500, error.message);
  }
};
