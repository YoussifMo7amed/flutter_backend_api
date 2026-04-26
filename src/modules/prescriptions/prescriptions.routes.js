import express from 'express';
import { getPrescriptions } from './prescriptions.controller.js';
import { protect } from '../../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getPrescriptions);

export default router;
