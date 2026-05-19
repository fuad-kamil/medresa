import Student from '../models/Student.js'
import Attendance from '../models/Attendance.js'
import sendEmail from '../utils/sendEmail.js'
import User from '../models/User.js'
import bcrypt from 'bcryptjs'

// Get Students assigned to this Ustaz
export const getMyStudents = async (req, res) => {
    try {
        const students = await Student.find({
            assignedUstaz: req.user.id
        })

        res.json(students)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Get Weekly Attendance for the logged-in Ustaz
export const getWeeklyAttendance = async (req, res) => {
    try {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday as start of week
        startOfWeek.setHours(0, 0, 0, 0);

        const attendanceRecords = await Attendance.find({
            ustaz: req.user.id,
            date: { $gte: startOfWeek, $lte: today }
        }).populate('student', 'fullName surah fatherPhone motherPhone');

        res.json(attendanceRecords);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Update Ustaz Profile
export const updateUstazProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.phone = req.body.phone || user.phone;

        const updatedUser = await user.save();

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                role: updatedUser.role,
                isApproved: updatedUser.isApproved
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Update Ustaz Password
export const updateUstazPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let isMatch = false;
        if (user.password && user.password.startsWith('$2')) {
            isMatch = await bcrypt.compare(currentPassword, user.password);
        } else {
            isMatch = (currentPassword === user.password);
        }

        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect current password' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Register a new student (Assigned specifically to this Ustaz)
export const registerStudent = async (req, res) => {
    try {
        const { fullName, surah, fatherPhone, motherPhone, address, stream } = req.body;

        const student = await Student.create({
            fullName,
            surah: stream === 'kitab' ? '' : surah,
            fatherPhone,
            motherPhone,
            address,
            stream: stream || 'quran',
            assignedUstaz: req.user.id // Automatically assign to the logged-in ustaz
        });

        res.status(201).json({
            message: 'Student registered successfully',
            student
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Update an existing student (Only if assigned to this Ustaz)
export const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, surah, fatherPhone, motherPhone, address, stream } = req.body;

        // Ensure the student actually belongs to this ustaz before updating
        const student = await Student.findOneAndUpdate(
            { _id: id, assignedUstaz: req.user.id },
            { fullName, surah: stream === 'kitab' ? '' : surah, fatherPhone, motherPhone, address, stream: stream || 'quran' },
            { new: true }
        );

        if (!student) {
            return res.status(404).json({ message: 'Student not found or not assigned to you' });
        }

        res.json({ message: 'Student updated successfully', student });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Update Student Exam Scores
export const updateStudentScores = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstExam, secondExam, finalExam } = req.body;

        // Ensure the student belongs to this Ustaz
        const student = await Student.findOne({ _id: id, assignedUstaz: req.user.id });
        if (!student) {
            return res.status(404).json({ message: 'Student not found or not assigned to you' });
        }

        student.firstExam = firstExam !== undefined ? Number(firstExam) : student.firstExam;
        student.secondExam = secondExam !== undefined ? Number(secondExam) : student.secondExam;
        student.finalExam = finalExam !== undefined ? Number(finalExam) : student.finalExam;

        await student.save();

        res.json({ message: 'Exam scores updated successfully', student });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}