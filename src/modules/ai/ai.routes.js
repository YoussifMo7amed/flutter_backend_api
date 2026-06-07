import express from 'express';
import { protect } from '../../middlewares/auth.middleware.js';
import upload from '../../middlewares/upload.middleware.js';
import * as aiController from './ai.controller.js';
import { validateSymptoms, validateImageUpload } from './ai.validation.js';

const router = express.Router();

router.use(protect);

router.post('/symptoms', validateSymptoms, aiController.processSymptoms);
router.post('/image', upload.single('image'), validateImageUpload, aiController.processImage);
router.get('/history', aiController.getHistory);
router.get('/history/:id', aiController.getAnalysisById);
router.delete('/history/:id', aiController.deleteAnalysis);

export default router;
