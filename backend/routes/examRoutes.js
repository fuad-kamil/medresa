import express from 'express';
import protect from '../middleware/auth.js';
import adminOnly from '../middleware/adminOnly.js';
import { getExams, createExam, updateExam, deleteExam } from '../controllers/examController.js';

const router = express.Router();

router.use(protect);

router.get('/', getExams);
router.post('/', adminOnly, createExam);
router.put('/:id', adminOnly, updateExam);
router.delete('/:id', adminOnly, deleteExam);

export default router;
