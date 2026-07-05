import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Attendance from './models/Attendance.js';
import Student from './models/Student.js';
import User from './models/User.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Find the student with the most attendance records
    const records = await Attendance.find().sort({ date: -1 }).populate('student');
    
    console.log(`Total Attendance Records: ${records.length}`);
    
    // Group by student
    const studentMap = {};
    for (const r of records) {
        if (!r.student) continue;
        const id = r.student._id.toString();
        if (!studentMap[id]) studentMap[id] = { name: r.student.fullName, records: [] };
        studentMap[id].records.push(r);
    }
    
    for (const id in studentMap) {
        console.log(`\nStudent: ${studentMap[id].name}`);
        
        const recent = studentMap[id].records.slice(0, 5); // top 5 most recent
        
        const uniqueDays = [];
        const seenDates = new Set();
        
        for (const record of recent) {
            const dateStr = new Date(record.date).toISOString().split('T')[0];
            console.log(` - Date: ${dateStr}, Status: ${record.status}`);
            
            if (!seenDates.has(dateStr)) {
                seenDates.add(dateStr);
                uniqueDays.push(record);
            }
            if (uniqueDays.length === 3) break;
        }
        
        if (uniqueDays.length === 3 && uniqueDays.every(a => a.status === 'absent')) {
            console.log(`   >> WOULD TRIGGER 3-ABSENCE EMAIL!`);
        } else {
            console.log(`   >> Not 3 consecutive absences. Unique length: ${uniqueDays.length}`);
            console.log(`      Statuses: ${uniqueDays.map(u => u.status).join(', ')}`);
        }
    }
    
    process.exit(0);
}

run();
