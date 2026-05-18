import express from 'express'

const router = express.Router()

import protect from '../middleware/auth.js'
import adminOnly from '../middleware/adminOnly.js'

import {
    getAllUstazs,
    approveUstaz,
    registerStudent,
    getAllStudents,
    getTodayAttendance,
    getStudentAttendanceHistory,
    deleteStudent,
    transferStudent,
    updateStudent,
    updateAdminProfile,
    updateAdminPassword
} from '../controllers/adminController.js'

// Ustaz management
router.get('/ustazs', protect, adminOnly, getAllUstazs)
router.patch('/ustaz/approve/:id', protect, adminOnly, approveUstaz)

// Student management
router.post('/students', protect, adminOnly, registerStudent)
router.get('/students', protect, adminOnly, getAllStudents)
router.get('/students/:id/attendance', protect, adminOnly, getStudentAttendanceHistory)
router.put('/students/:id', protect, adminOnly, updateStudent)
router.delete('/students/:id', protect, adminOnly, deleteStudent)
router.patch('/students/:id/transfer', protect, adminOnly, transferStudent)

// Attendance
router.get('/attendance/today', protect, adminOnly, getTodayAttendance)

// Admin Settings
router.put('/settings/profile', protect, adminOnly, updateAdminProfile)
router.put('/settings/password', protect, adminOnly, updateAdminPassword)

export default router