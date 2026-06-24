import express from 'express'

const router = express.Router()

import protect from '../middleware/auth.js'
import ustazOnly from '../middleware/ustazOnly.js'

import { getMyStudents, getWeeklyAttendance, updateUstazProfile, updateUstazPassword, registerStudent, updateStudent, updateStudentScores } from '../controllers/ustazController.js'
import { markAttendance, updateAttendance, getAttendanceByDate } from '../controllers/attendanceController.js'
import { getMyExams, createMyExam, updateMyExam, deleteMyExam } from '../controllers/examController.js'

// Ustaz-only routes
router.get('/students', protect, ustazOnly, getMyStudents)
router.post('/students', protect, ustazOnly, registerStudent)
router.put('/students/:id', protect, ustazOnly, updateStudent)
router.put('/students/:id/scores', protect, ustazOnly, updateStudentScores)
router.post('/attendance', protect, ustazOnly, markAttendance)
router.put('/attendance', protect, ustazOnly, updateAttendance)
router.get('/attendance', protect, ustazOnly, getAttendanceByDate)
router.get('/attendance/weekly', protect, ustazOnly, getWeeklyAttendance)

// Ustaz Exam Management (per-ustaz scoped)
router.get('/exams', protect, ustazOnly, getMyExams)
router.post('/exams', protect, ustazOnly, createMyExam)
router.put('/exams/:id', protect, ustazOnly, updateMyExam)
router.delete('/exams/:id', protect, ustazOnly, deleteMyExam)

// Ustaz Settings
router.put('/settings/profile', protect, ustazOnly, updateUstazProfile)
router.put('/settings/password', protect, ustazOnly, updateUstazPassword)

export default router