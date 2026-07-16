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
    bulkImportStudents,
    clearUnassignedStudents,
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
    getAdminWeeklyAbsentees,
    registerUstazByAdmin,
    resetUstazSemester,
    getSemesterArchives,
    getStudentQuranProgressHistory,
    getInviteCode,
    updateInviteCode
} from '../controllers/adminController.js'

import { getExamsByUstaz, updateExam, deleteExam } from '../controllers/examController.js'
import { getNotifications, markNotificationRead, markAllNotificationsRead, deleteNotification, deleteMultipleNotifications } from '../controllers/notificationController.js'
import { sendStudentReport, sendAllReports, cleanupOldReports } from '../controllers/reportController.js'
import { getBotLocked, setBotLocked } from '../bot/telegramBot.js'

// Ustaz management
router.get('/ustazs', protect, adminOnly, getAllUstazs)
router.post('/ustazs', protect, adminOnly, registerUstazByAdmin)
router.get('/ustazs/attendance-status', protect, adminOnly, getUstazAttendanceStatus)
router.patch('/ustaz/approve/:id', protect, adminOnly, approveUstaz)
router.delete('/ustaz/:id', protect, adminOnly, deleteUstaz)
router.post('/ustaz/:id/reset-semester', protect, adminOnly, resetUstazSemester)
router.get('/semester-archives', protect, adminOnly, getSemesterArchives)

// Student management
router.post('/students', protect, adminOnly, upload.single('photo'), registerStudent)
router.post('/students/bulk', protect, adminOnly, bulkImportStudents)
router.get('/students', protect, adminOnly, getAllStudents)
router.get('/students/with-stats', protect, adminOnly, getAllStudentsWithStats)
router.get('/students/:id', protect, adminOnly, getStudentById)
router.get('/students/:id/attendance', protect, adminOnly, getStudentAttendanceHistory)
router.delete('/students/:id/attendance', protect, adminOnly, resetStudentAttendance)
router.put('/students/:id', protect, adminOnly, upload.single('photo'), updateStudent)
router.put('/students/:id/scores', protect, adminOnly, updateStudentScores)
router.get('/students/:id/quran-progress', protect, adminOnly, getStudentQuranProgressHistory)

// PDF Reports
router.post('/students/:id/send-report', protect, adminOnly, sendStudentReport)
router.post('/send-all-reports', protect, adminOnly, sendAllReports)
router.delete('/cleanup-reports', protect, adminOnly, cleanupOldReports)

router.delete('/students/unassigned/clear', protect, adminOnly, clearUnassignedStudents)
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
router.get('/settings/invite-code', protect, adminOnly, getInviteCode)
router.put('/settings/invite-code', protect, adminOnly, updateInviteCode)

// Notifications
router.get('/notifications', protect, adminOnly, getNotifications)
router.patch('/notifications/read-all', protect, adminOnly, markAllNotificationsRead)
router.patch('/notifications/:id/read', protect, adminOnly, markNotificationRead)
router.delete('/notifications/bulk', protect, adminOnly, deleteMultipleNotifications)
router.delete('/notifications/:id', protect, adminOnly, deleteNotification)

// Telegram Bot Lock
router.get('/bot-status',  protect, adminOnly, (req, res) => {
    res.json({ success: true, locked: getBotLocked() })
})
router.post('/bot-lock', protect, adminOnly, (req, res) => {
    const { locked } = req.body
    if (typeof locked !== 'boolean') {
        return res.status(400).json({ success: false, message: 'locked must be a boolean' })
    }
    setBotLocked(locked)
    res.json({ success: true, locked, message: locked ? 'Bot has been locked.' : 'Bot is now active.' })
})

export default router