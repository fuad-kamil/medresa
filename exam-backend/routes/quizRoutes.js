import express from 'express';
import {
  createQuiz,
  getQuizzesByUstaz,
  getQuizForStudent,
  submitQuiz,
  checkStudentSubmission,
  allowRetake,
  addQuizTime,
  endQuiz,
  deleteQuiz,
  getQuizSubmissions,
  gradeOpenAnswers
} from '../controllers/quizController.js';

const router = express.Router();

// Ustaz Endpoints
router.post('/create', createQuiz);
router.get('/ustaz/:ustazId', getQuizzesByUstaz);
router.post('/add-time', addQuizTime);
router.post('/:id/add-time', addQuizTime);
router.put('/end/:id', endQuiz);
router.post('/:id/end', endQuiz);
router.delete('/delete/:id', deleteQuiz);
router.delete('/:id', deleteQuiz);
router.get('/submissions/:id', getQuizSubmissions);
router.get('/:id/submissions', getQuizSubmissions);
router.post('/allow-retake', allowRetake);
router.put('/:id/grade-open', gradeOpenAnswers);

// Student Endpoints
router.get('/student/check-submission', checkStudentSubmission);
router.get('/student/:id', getQuizForStudent);
router.post('/student/submit', submitQuiz);

export default router;
