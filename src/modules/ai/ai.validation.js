import { sendResponse } from '../../utils/response.js';

export const validateSymptoms = (req, res, next) => {
  const { symptoms } = req.body;
  if (!symptoms || typeof symptoms !== 'string' || symptoms.trim().length < 5) {
    return sendResponse(res, 400, 'Symptoms text is required and must be at least 5 characters long');
  }
  next();
};

export const validateImageUpload = (req, res, next) => {
  if (!req.file) {
    return sendResponse(res, 400, 'Image file is required');
  }
  
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return sendResponse(res, 400, 'Only JPEG and PNG images are allowed');
  }

  // Max 5MB
  if (req.file.size > 5 * 1024 * 1024) {
    return sendResponse(res, 400, 'Image size should not exceed 5MB');
  }

  next();
};
