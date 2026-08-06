import express from 'express';
import protect from '../middleware/auth.js';
import adminOnly from '../middleware/adminOnly.js';
import { 
    getExams, 
    createExam, 
    updateExam, 
    deleteExam,
    getMyExams,
    createMyExam,
    updateMyExam,
    deleteMyExam,
    verifyStudent,
    sendExamHeartbeat,
    releaseStudentSession,
    syncExamScore,
    clearExamScore,
    getExamSystemStatus,
    toggleExamSystemLock
} from '../controllers/examController.js';

const router = express.Router();

// Public / Service endpoints (No user token required)
router.post('/verify-student', verifyStudent);
router.post('/heartbeat', sendExamHeartbeat);
router.post('/release-session', releaseStudentSession);
router.post('/sync-score', syncExamScore);
router.post('/clear-score', clearExamScore);
router.get('/system-status', getExamSystemStatus);

// Protected endpoints
router.get('/my-exams', protect, getMyExams);
router.post('/my-exams', protect, createMyExam);
router.put('/my-exams/:id', protect, updateMyExam);
router.delete('/my-exams/:id', protect, deleteMyExam);

router.get('/', protect, getExams);
router.post('/', protect, adminOnly, createExam);
router.put('/:id', protect, adminOnly, updateExam);
router.delete('/:id', protect, adminOnly, deleteExam);
router.post('/system-lock', protect, adminOnly, toggleExamSystemLock);

export default router;
