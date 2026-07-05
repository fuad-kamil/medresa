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
        const { fullName, surah, fatherPhone, motherPhone, address, assignedUstaz, stream } = req.body
        const photo = req.file ? req.file.path : null;

        let finalSurah = surah;
        let finalStream = stream || 'quran';

        if (assignedUstaz) {
            const ustaz = await User.findById(assignedUstaz);
            if (ustaz) {
                finalStream = ustaz.stream || 'quran';
                if (ustaz.stream === 'kitab') {
                    finalSurah = ustaz.kitabName || surah;
                }
            }
        }

        const student = await Student.create({
            fullName,
            surah: finalSurah,
            fatherPhone,
            motherPhone,
            address,
            assignedUstaz: assignedUstaz || undefined,
            stream: finalStream,
            photo: photo || undefined
        })

        res.status(201).json({
            message: 'Student registered successfully',
            student
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Bulk Import Students
export const bulkImportStudents = async (req, res) => {
    try {
        const studentsData = req.body; 
        
        if (!Array.isArray(studentsData) || studentsData.length === 0) {
            return res.status(400).json({ message: 'No valid students data provided' });
        }

        // Validate and sanitize incoming JSON
        const validStudents = studentsData.map(s => {
            return {
                fullName: s.fullName,
                stream: (s.stream && s.stream.toString().toLowerCase() === 'kitab') ? 'kitab' : 'quran',
                fatherPhone: s.fatherPhone,
                motherPhone: s.motherPhone || '',
                address: s.address || '',
                status: 'active'
            };
        }).filter(s => s.fullName && s.fatherPhone); // Only keep rows with required fields

        if (validStudents.length === 0) {
            return res.status(400).json({ message: 'No valid students found in the upload. Please check required columns (Full Name, Father Phone).' });
        }

        const inserted = await Student.insertMany(validStudents);

        res.status(201).json({
            message: `Successfully imported ${inserted.length} students`,
            count: inserted.length
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Get All Students (fast - uses aggregation pipeline, includes attendance stats)
export const getAllStudents = async (req, res) => {
    try {
        const students = await Student.find()
            .populate('assignedUstaz', 'name email')
            .lean();

        // Single aggregation query for ALL students at once (not N+1)
        const stats = await Attendance.aggregate([
            {
                $group: {
                    _id: '$student',
                    presentCount: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
                    absentCount: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
                    excusedCount: { $sum: { $cond: [{ $eq: ['$status', 'excused'] }, 1, 0] } }
                }
            }
        ]);

        // Fast in-memory lookup map
        const statsMap = {};
        stats.forEach((item) => {
            if (item._id) {
                statsMap[item._id.toString()] = {
                    presentCount: item.presentCount || 0,
                    absentCount: item.absentCount || 0,
                    excusedCount: item.excusedCount || 0
                };
            }
        });

        const studentsWithStats = students.map((student) => {
            const s = statsMap[student._id.toString()] || { presentCount: 0, absentCount: 0, excusedCount: 0 };
            return { ...student, ...s };
        });

        res.json(studentsWithStats);
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Get All Students WITH attendance stats (alias - same as getAllStudents, kept for compatibility)
export const getAllStudentsWithStats = getAllStudents;

// Get Single Student
export const getStudentById = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id)
            .populate('assignedUstaz', 'name email stream')
            .lean();
            
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const stats = await Attendance.aggregate([
            { $match: { student: student._id } },
            {
                $group: {
                    _id: null,
                    presentCount: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
                    absentCount: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
                    excusedCount: { $sum: { $cond: [{ $eq: ['$status', 'excused'] }, 1, 0] } }
                }
            }
        ]);

        const s = stats.length > 0 ? stats[0] : { presentCount: 0, absentCount: 0, excusedCount: 0 };
        res.json({ ...student, ...s });
    } catch (error) {
        res.status(500).json({ message: error.message });
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

// Reset Student Attendance History
export const resetStudentAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        await Attendance.deleteMany({ student: id });
        res.json({ message: 'Attendance history reset successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Clear All Unassigned Students
export const clearUnassignedStudents = async (req, res) => {
    try {
        const result = await Student.deleteMany({
            $or: [
                { assignedUstaz: { $exists: false } },
                { assignedUstaz: null }
            ]
        });
        res.json({ message: `Successfully deleted ${result.deletedCount} unassigned students` });
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

        const updateData = { assignedUstaz };
        
        if (assignedUstaz) {
            const ustaz = await User.findById(assignedUstaz);
            if (ustaz) {
                updateData.stream = ustaz.stream || 'quran';
                if (ustaz.stream === 'kitab') {
                    updateData.surah = ustaz.kitabName || '';
                }
            }
        }

        const student = await Student.findByIdAndUpdate(
            id,
            updateData,
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
        const { fullName, surah, fatherPhone, motherPhone, address, assignedUstaz, stream } = req.body;
        
        const updateData = { fullName, surah, fatherPhone, motherPhone, address, stream: stream || 'quran' };
        
        if (assignedUstaz) {
            updateData.assignedUstaz = assignedUstaz;
            const ustaz = await User.findById(assignedUstaz);
            if (ustaz) {
                updateData.stream = ustaz.stream || 'quran';
                if (ustaz.stream === 'kitab') {
                    updateData.surah = ustaz.kitabName || surah;
                }
            }
        } else {
            updateData.$unset = { assignedUstaz: "" };
        }

        if (req.file) {
            updateData.photo = req.file.path;
        }

        const student = await Student.findByIdAndUpdate(
            id,
            updateData,
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

// Update Student Exam Scores (Admin)
export const updateStudentScores = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstExam, secondExam, finalExam, examScores } = req.body;

        const student = await Student.findById(id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        if (firstExam !== undefined) student.firstExam = Number(firstExam);
        if (secondExam !== undefined) student.secondExam = Number(secondExam);
        if (finalExam !== undefined) student.finalExam = Number(finalExam);

        if (examScores) {
            for (const [examId, score] of Object.entries(examScores)) {
                student.examScores.set(examId, score === "" || score === null ? 0 : Number(score));
            }
        }

        await student.save();

        res.json({ message: 'Exam scores updated successfully', student });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Get Ustaz Attendance Status (today + last 3 relevant days per ustaz)
export const getUstazAttendanceStatus = async (req, res) => {
    try {
        const ustazs = await User.find({ role: 'ustaz', isApproved: true }).select('_id stream teachingDays');

        // Fetch last 14 days of attendance for all ustazs in one query
        const since = new Date();
        since.setDate(since.getDate() - 14);
        since.setHours(0, 0, 0, 0);

        const ustazIds = ustazs.map(u => u._id);
        const records = await Attendance.find({
            ustaz: { $in: ustazIds },
            date: { $gte: since }
        }).select('ustaz date');

        // Build a fast lookup Set: "ustazId_YYYY-MM-DD"
        const takenSet = new Set();
        for (const r of records) {
            const dateStr = new Date(r.date).toISOString().split('T')[0];
            takenSet.add(`${r.ustaz.toString()}_${dateStr}`);
        }

        // Get last 4 relevant days going backwards from today
        const getRelevantDays = (ustaz) => {
            const days = [];
            const cursor = new Date();
            cursor.setHours(0, 0, 0, 0);
            
            const teachingDays = new Set(ustaz.teachingDays && ustaz.teachingDays.length > 0 ? ustaz.teachingDays : [0, 1, 2, 3, 4, 5, 6]);

            while (days.length < 4) {
                const dow = cursor.getDay();
                if (teachingDays.has(dow)) {
                    days.push(new Date(cursor));
                }
                cursor.setDate(cursor.getDate() - 1);
            }
            return days; // [most recent, ..., oldest]
        };

        const result = {};
        for (const ustaz of ustazs) {
            const days = getRelevantDays(ustaz);
            result[ustaz._id] = days.map((day, i) => {
                const dateStr = day.toISOString().split('T')[0];
                return {
                    date: dateStr,
                    taken: takenSet.has(`${ustaz._id}_${dateStr}`),
                    dayName: day.toLocaleDateString('en-US', { weekday: 'short' }),
                    isToday: i === 0
                };
            });
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// Get Admin Weekly Absentees
export const getAdminWeeklyAbsentees = async (req, res) => {
    try {
        let { year, month, week } = req.query;
        
        const currentDate = new Date();
        year = year ? parseInt(year) : currentDate.getFullYear();
        month = month ? parseInt(month) : currentDate.getMonth() + 1; // 1-12
        
        if (!week) {
            const currentDay = currentDate.getDate();
            if (currentDay <= 7) week = 1;
            else if (currentDay <= 14) week = 2;
            else if (currentDay <= 21) week = 3;
            else week = 4;
        } else {
            week = parseInt(week);
        }
        
        // Define week boundaries
        let startDay, endDay;
        if (week === 1) { startDay = 1; endDay = 7; }
        else if (week === 2) { startDay = 8; endDay = 14; }
        else if (week === 3) { startDay = 15; endDay = 21; }
        else if (week === 4) { 
            startDay = 22; 
            endDay = new Date(year, month, 0).getDate(); // last day of the month
        } else {
            return res.status(400).json({ message: 'Invalid week number' });
        }

        const startDate = new Date(year, month - 1, startDay, 0, 0, 0, 0);
        const endDate = new Date(year, month - 1, endDay, 23, 59, 59, 999);

        const attendanceRecords = await Attendance.find({
            date: { $gte: startDate, $lte: endDate },
            status: 'absent'
        })
        .populate('student', 'fullName surah fatherPhone motherPhone stream')
        .populate('ustaz', 'name stream kitabName');

        res.json(attendanceRecords);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}