import Attendance from '../models/Attendance.js'
import Student from '../models/Student.js'
import sendEmail from '../utils/sendEmail.js'

// Mark Attendance
export const markAttendance = async (req, res) => {
    try {
        const { attendance, date } = req.body // { studentId: "present/absent/excused" }
        const ustazId = req.user.id

        // Determine the date to use (default to today)
        const attendanceDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(attendanceDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(attendanceDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Check if attendance was already taken for THIS specific day
        const recentAttendance = await Attendance.findOne({
            ustaz: ustazId,
            date: { $gte: startOfDay, $lte: endOfDay }
        })

        if (recentAttendance) {
            return res.status(400).json({ message: 'Attendance already taken for this date. You can edit it instead.' })
        }

        const records = []

        for (const [studentId, status] of Object.entries(attendance)) {
            const record = await Attendance.create({
                student: studentId,
                ustaz: ustazId,
                status,
                date: attendanceDate
            })

            records.push(record)
        }

        // Check for 3 consecutive absences
        await checkConsecutiveAbsences(Object.keys(attendance))

        res.json({
            message: 'Attendance marked successfully',
            records
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Edit Attendance
export const updateAttendance = async (req, res) => {
    try {
        const { attendance, date } = req.body // { studentId: "present/absent/excused" }
        const ustazId = req.user.id

        const attendanceDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(attendanceDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(attendanceDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Find records for this ustaz on this specific day
        const records = await Attendance.find({
            ustaz: ustazId,
            date: { $gte: startOfDay, $lte: endOfDay }
        })

        if (records.length === 0) {
            return res.status(400).json({ message: 'No attendance records found to edit for this date.' })
        }

        // Update or create the records
        for (const [studentId, status] of Object.entries(attendance)) {
            let record = records.find(r => r.student.toString() === studentId)
            
            if (record) {
                // Update existing record
                record.status = status
                await record.save()
            } else {
                // Create new record
                await Attendance.create({
                    student: studentId,
                    ustaz: ustazId,
                    status,
                    date: attendanceDate
                })
            }
        }

        // Check for 3 consecutive absences again just in case
        await checkConsecutiveAbsences(Object.keys(attendance))

        res.json({
            message: 'Attendance updated successfully'
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Helper: Check 3 consecutive absences
const checkConsecutiveAbsences = async (studentIds) => {
    for (const studentId of studentIds) {
        const recent = await Attendance.find({ student: studentId })
            .sort({ date: -1 })
            .limit(3)

        if (
            recent.length === 3 &&
            recent.every(att => att.status === 'absent')
        ) {
            const student = await Student.findById(studentId).populate(
                'assignedUstaz'
            )

            await sendEmail({
                to: process.env.EMAIL_USER,
                subject: `⚠️ Alert: 3 Consecutive Absences - ${student.fullName}`,
                text: `Student ${student.fullName} has missed 3 or more consecutive classes from Ustaz ${student.assignedUstaz.name}. Please call Father at ${student.fatherPhone} or Mother at ${student.motherPhone} to ask the reason.`,
                html: `
          <h3>3 Consecutive Absences Alert</h3>
          <p>Student <strong>${student.fullName}</strong> has missed 3 or more consecutive classes from Ustaz <strong>${student.assignedUstaz.name}</strong>.</p>
          <p>Please call them to ask the reason:</p>
          <ul>
            <li><strong>Father:</strong> ${student.fatherPhone}</li>
            <li><strong>Mother:</strong> ${student.motherPhone}</li>
          </ul>
        `
            })
        }
    }
}