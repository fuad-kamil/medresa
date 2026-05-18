// scratch_check_attendance.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Attendance from './models/Attendance.js';
import Student from './models/Student.js';
import User from './models/User.js'; // Register User model!

dotenv.config();

const checkAttendance = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const students = await Student.find({}, { fullName: 1 });
        console.log("=== STUDENTS ===");
        console.log(students);
        
        for (const s of students) {
            const records = await Attendance.find({ student: s._id })
                .populate('ustaz', 'name')
                .sort({ date: -1 });
            console.log(`\n=== ATTENDANCE FOR STUDENT: ${s.fullName} ===`);
            console.log(records.map(r => ({
                id: r._id,
                date: r.date,
                status: r.status,
                ustaz: r.ustaz?.name
            })));
        }
        
        mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
};

checkAttendance();
