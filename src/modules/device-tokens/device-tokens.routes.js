import express from 'express';
import { registerToken, unregisterToken } from './device-tokens.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/register', protect, registerToken);
router.delete('/unregister', protect, unregisterToken);

export default router;
