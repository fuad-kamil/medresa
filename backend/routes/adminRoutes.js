import express from 'express'

const router = express.Router()

import protect from '../middleware/auth.js'
import adminOnly from '../middleware/adminOnly.js'

import {
    getAllUstazs,
    approveUstaz,
    deleteUstaz,
    registerStudent,
    getAllStudents,
    getTodayAttendance,
    getStudentAttendanceHistory,
    deleteStudent,
    transferStudent,
    updateStudent,
    updateStudentScores,
    updateAdminProfile,
    updateAdminPassword
} from '../controllers/adminController.js'

// Ustaz management
router.get('/ustazs', protect, adminOnly, getAllUstazs)
router.patch('/ustaz/approve/:id', protect, adminOnly, approveUstaz)
router.delete('/ustaz/:id', protect, adminOnly, deleteUstaz)

// Student management
router.post('/students', protect, adminOnly, registerStudent)
router.get('/students', protect, adminOnly, getAllStudents)
router.get('/students/:id/attendance', protect, adminOnly, getStudentAttendanceHistory)
router.put('/students/:id', protect, adminOnly, updateStudent)
router.put('/students/:id/scores', protect, adminOnly, updateStudentScores)
router.delete('/students/:id', protect, adminOnly, deleteStudent)
router.patch('/students/:id/transfer', protect, adminOnly, transferStudent)

// Attendance
router.get('/attendance/today', protect, adminOnly, getTodayAttendance)

// Admin Settings
router.put('/settings/profile', protect, adminOnly, updateAdminProfile)
router.put('/settings/password', protect, adminOnly, updateAdminPassword)

export default router