import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendResponse } from '../utils/response.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id);
      if (!req.user) {
        return sendResponse(res, 401, 'Not authorized, user not found');
      }
      next();
    } catch (error) {
      return sendResponse(res, 401, 'Not authorized, token failed');
    }
  }

  if (!token) {
    return sendResponse(res, 401, 'Not authorized, no token');
  }
};
