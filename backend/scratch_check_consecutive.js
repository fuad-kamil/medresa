import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Student from './models/Student.js';
import Attendance from './models/Attendance.js';
import User from './models/User.js';

dotenv.config();

const checkStatus = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const students = await Student.find({ fullName: { $in: ['Fuad Kamil', 'Ibrahim Kamil'] } }).populate('assignedUstaz');
        
        for (const s of students) {
            console.log(`\n=== Student: ${s.fullName} ===`);
            console.log(`Assigned Ustaz: ${s.assignedUstaz ? s.assignedUstaz.name : 'NONE'}`);
            
            const recent = await Attendance.find({ student: s._id })
                .sort({ date: -1 })
                .limit(3);
            console.log("Recent 3 records:");
            console.log(recent.map(r => ({ date: r.date, status: r.status, ustaz: r.ustaz })));
            
            const isTriggered = recent.length === 3 && recent.every(att => att.status === 'absent');
            console.log(`Trigger condition met: ${isTriggered}`);
        }
        mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

checkStatus();
