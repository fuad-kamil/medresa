import express from 'express'

const router = express.Router()

import protect from '../middleware/auth.js'
import adminOnly from '../middleware/adminOnly.js'
import upload from '../middleware/upload.js'

import {
    getAllUstazs,
    approveUstaz,
    deleteUstaz,
    registerStudent,
    getAllStudents,
    getStudentById,
    getAllStudentsWithStats,
    getTodayAttendance,
    getStudentAttendanceHistory,
    resetStudentAttendance,
    deleteStudent,
    transferStudent,
    updateStudent,
    updateStudentScores,
    updateAdminProfile,
    updateAdminPassword,
    getUstazAttendanceStatus,
    getAdminWeeklyAbsentees
} from '../controllers/adminController.js'

import { getExamsByUstaz, updateExam, deleteExam } from '../controllers/examController.js'

// Ustaz management
router.get('/ustazs', protect, adminOnly, getAllUstazs)
router.get('/ustazs/attendance-status', protect, adminOnly, getUstazAttendanceStatus)
router.patch('/ustaz/approve/:id', protect, adminOnly, approveUstaz)
router.delete('/ustaz/:id', protect, adminOnly, deleteUstaz)

// Student management
router.post('/students', protect, adminOnly, upload.single('photo'), registerStudent)
router.get('/students', protect, adminOnly, getAllStudents)
router.get('/students/with-stats', protect, adminOnly, getAllStudentsWithStats)
router.get('/students/:id', protect, adminOnly, getStudentById)
router.get('/students/:id/attendance', protect, adminOnly, getStudentAttendanceHistory)
router.delete('/students/:id/attendance', protect, adminOnly, resetStudentAttendance)
router.put('/students/:id', protect, adminOnly, upload.single('photo'), updateStudent)
router.put('/students/:id/scores', protect, adminOnly, updateStudentScores)
router.delete('/students/:id', protect, adminOnly, deleteStudent)
router.patch('/students/:id/transfer', protect, adminOnly, transferStudent)

// Attendance
router.get('/attendance/today', protect, adminOnly, getTodayAttendance)
router.get('/weekly-absentees', protect, adminOnly, getAdminWeeklyAbsentees)

// Exams — Admin can view/manage per-ustaz exam columns
router.get('/exams/ustaz/:ustazId', protect, adminOnly, getExamsByUstaz)
router.put('/exams/:id', protect, adminOnly, updateExam)
router.delete('/exams/:id', protect, adminOnly, deleteExam)

// Admin Settings
router.put('/settings/profile', protect, adminOnly, updateAdminProfile)
router.put('/settings/password', protect, adminOnly, updateAdminPassword)

export default router