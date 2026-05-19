import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Attendance from './models/Attendance.js';
import Student from './models/Student.js';

dotenv.config();

const testTrigger = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        
        const student = await Student.findOne({ fullName: 'Amir Mohammed' });
        if (!student) {
            console.log("Student not found");
            return;
        }
        
        const recent = await Attendance.find({ student: student._id })
            .sort({ date: -1 })
            .limit(3);
            
        console.log("=== RECENT RECORDS ===");
        console.log(recent.map(r => ({ date: r.date, status: r.status })));
        
        const isTriggered = recent.length === 3 && recent.every(att => att.status === 'absent');
        console.log("Condition met (recent.length === 3 && all absent):", isTriggered);
        
        mongoose.disconnect();
    } catch (error) {
        console.error(error);
    }
};

testTrigger();
