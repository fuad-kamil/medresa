import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Student from './models/Student.js';
import { v2 as cloudinary } from 'cloudinary';
import { generateReportPDF } from './utils/generateReportPDF.js';
import crypto from 'crypto';
import Exam from './models/Exam.js';
import Attendance from './models/Attendance.js';
import User from './models/User.js';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const computeScoresHash = (scores) => {
    const keys = Object.keys(scores).sort();
    let str = "";
    for (const k of keys) {
        str += `${k}:${scores[k]}|`;
    }
    return crypto.createHash('md5').update(str).digest('hex');
};

async function test() {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Find the student 'Hello'
    const student = await Student.findOne({ fullName: /Hello/i }).populate('assignedUstaz');
    if (!student) {
        console.log("Student not found");
        process.exit(1);
    }
    
    console.log("Found student:", student.fullName);
    
    try {
        const ustazId = student.assignedUstaz?._id || student.assignedUstaz;
        let exams = [];
        if (ustazId) {
            exams = await Exam.find({ ustaz: ustazId }).sort({ createdAt: 1 });
        }
        
        const plainScores = {};
        if (student.examScores) {
            for (const [key, value] of student.examScores.entries()) {
                plainScores[key] = value;
            }
        }
        
        console.log("Generating PDF...");
        const pdfBytes = await generateReportPDF(student, exams, plainScores, 1, 1, "Test", "Test");
        console.log("PDF generated, size:", pdfBytes.length);
        
        console.log("Uploading to Cloudinary...");
        
        const url = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'medresa/report_cards',
                    resource_type: 'raw',
                    format: 'pdf',
                    public_id: `report_${student._id}_${Date.now()}`
                },
                (error, result) => {
                    if (error) {
                        console.error("CLOUDINARY ERROR:", error);
                        return reject(error);
                    }
                    resolve(result.secure_url);
                }
            );
            uploadStream.end(Buffer.from(pdfBytes));
        });
        
        console.log("Success! URL:", url);
    } catch (e) {
        console.error("Test failed:", e);
    }
    
    process.exit(0);
}

test();
