import User from '../models/User.js'
import Student from '../models/Student.js'
import Attendance from '../models/Attendance.js'
import sendEmail from '../utils/sendEmail.js'
import bcrypt from 'bcryptjs'

// Get all Ustazs (Pending + Approved)
export const getAllUstazs = async (req, res) => {
    try {
        const ustazs = await User.find({ role: 'ustaz' }).select('-password')
        res.json(ustazs)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Approve Ustaz
export const approveUstaz = async (req, res) => {
    try {
        const { id } = req.params

        const ustaz = await User.findByIdAndUpdate(
            id,
            { isApproved: true },
            { new: true }
        )

        if (!ustaz) {
            return res.status(404).json({ message: 'Ustaz not found' })
        }

        res.json({
            message: 'Ustaz approved successfully',
            ustaz
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Register Student
export const registerStudent = async (req, res) => {
    try {
        const { fullName, surah, fatherPhone, motherPhone, assignedUstaz } = req.body

        const student = await Student.create({
            fullName,
            surah,

            fatherPhone,
            motherPhone,
            assignedUstaz
        })

        res.status(201).json({
            message: 'Student registered successfully',
            student
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Get All Students
export const getAllStudents = async (req, res) => {
    try {
        const students = await Student.find()
            .populate('assignedUstaz', 'name email')

        res.json(students)
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Get Today's Attendance
export const getTodayAttendance = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const attendance = await Attendance.find({
            date: { $gte: today, $lt: tomorrow }
        });
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Get Student Attendance History
export const getStudentAttendanceHistory = async (req, res) => {
    try {
        const { id } = req.params;
        const history = await Attendance.find({ student: id })
            .populate('ustaz', 'name')
            .sort({ date: -1 });

        res.json(history);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Delete Student
export const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        await Student.findByIdAndDelete(id);
        
        // Optional: also delete all attendance records for this student
        await Attendance.deleteMany({ student: id });

        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Transfer Student
export const transferStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { assignedUstaz } = req.body;

        const student = await Student.findByIdAndUpdate(
            id,
            { assignedUstaz },
            { new: true }
        ).populate('assignedUstaz', 'name email');

        res.json({ message: 'Student transferred successfully', student });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Update Admin Profile
export const updateAdminProfile = async (req, res) => {
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
                role: updatedUser.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Update Admin Password
export const updateAdminPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let isMatch = false;
        // Check if current DB password is a bcrypt hash (starts with $2)
        if (user.password && user.password.startsWith('$2')) {
            isMatch = await bcrypt.compare(currentPassword, user.password);
        } else {
            // Fallback for manually inserted plaintext passwords
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

// Update Student
export const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, surah, fatherPhone, motherPhone, assignedUstaz } = req.body;

        const student = await Student.findByIdAndUpdate(
            id,
            { fullName, surah, fatherPhone, motherPhone, assignedUstaz },
            { new: true }
        ).populate('assignedUstaz', 'name email');

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.json({ message: 'Student updated successfully', student });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Delete Ustaz
export const deleteUstaz = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Remove Ustaz from User collection
        await User.findOneAndDelete({ _id: id, role: 'ustaz' });
        
        // Set assignedUstaz to null for any assigned students
        await Student.updateMany({ assignedUstaz: id }, { $unset: { assignedUstaz: "" } });
        
        res.json({ message: 'Ustaz deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}