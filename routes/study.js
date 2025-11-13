import express from 'express';
import { getStudyMaterial, getStudyHistory, deleteStudyHistory } from '../controllers/studyController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All study routes require authentication
router.get('/', authenticateToken, getStudyMaterial);
router.get('/history', authenticateToken, getStudyHistory);
router.delete('/history', authenticateToken, deleteStudyHistory);

export default router;
