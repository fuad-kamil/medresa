import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import Student from './models/Student.js';
import Exam from './models/Exam.js';
import Attendance from './models/Attendance.js';
import User from './models/User.js';
import crypto from 'crypto';
import { generateReportPDF } from './utils/generateReportPDF.js';
import { v2 as cloudinary } from 'cloudinary';

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

const getOrGenerateReport = async (student) => {
    // Fetch Exams
    const ustazId = student.assignedUstaz?._id || student.assignedUstaz;
    let exams = [];
    if (ustazId) {
        exams = await Exam.find({ ustaz: ustazId }).sort({ createdAt: 1 });
    }

    // Attendance Stats
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

    student.presentCount = stats[0]?.presentCount || 0;
    student.absentCount = stats[0]?.absentCount || 0;
    student.excusedCount = stats[0]?.excusedCount || 0;

    // Convert examScores Map to plain object
    const plainScores = {};
    if (student.examScores) {
        for (const [key, value] of student.examScores.entries()) {
            plainScores[key] = value;
        }
    }

    const currentHash = computeScoresHash(plainScores);

    // Hash mismatch (or no PDF yet) → regenerate
    const allUstazStudents = await Student.find({ assignedUstaz: ustazId });
    const studentsWithTotals = allUstazStudents.map(s => {
        let total = 0;
        if (s.examScores) {
            exams.forEach(ex => {
                total += Number(s.examScores.get(ex._id.toString())) || 0;
            });
        }
        return { id: s._id.toString(), total };
    }).sort((a, b) => b.total - a.total);

    const rankIndex = studentsWithTotals.findIndex(s => s.id === student._id.toString());
    const rank = rankIndex >= 0 ? rankIndex + 1 : null;
    const totalStudents = allUstazStudents.length;

    const ustazName = student.assignedUstaz?.name;
    const kitabName = student.assignedUstaz?.kitabName || student.stream;

    console.log("Generating PDF internally...");
    const pdfBytes = await generateReportPDF(student, exams, plainScores, rank, totalStudents, ustazName, kitabName);
    console.log("Internal PDF generation complete.");

    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'medresa/report_cards',
                resource_type: 'raw',
                format: 'pdf',
                public_id: `report_${student._id}_${Date.now()}`
            },
            async (error, result) => {
                if (error) return reject(error);

                if (student.reportCardPublicId) {
                    try {
                        await cloudinary.uploader.destroy(student.reportCardPublicId, { resource_type: 'raw' });
                    } catch (e) {
                        console.error('Failed to delete old PDF:', e);
                    }
                }

                student.reportCardUrl = result.secure_url;
                student.reportCardPublicId = result.public_id;
                student.reportScoresHash = currentHash;
                student.reportCardGeneratedAt = new Date();
                await student.save();

                resolve(result.secure_url);
            }
        );
        uploadStream.end(Buffer.from(pdfBytes));
    });
};

async function test() {
    await mongoose.connect(process.env.MONGO_URI);
    
    const student = await Student.findOne({ fullName: /Amir Reshid/i }).populate('assignedUstaz');
    if (!student) {
        console.log("Student not found");
        process.exit(1);
    }
    
    console.log("Found student:", student.fullName);
    console.log("Assigned Ustaz populated:", !!student.assignedUstaz);
    console.log("Assigned Ustaz value:", student.assignedUstaz);
    
    try {
        const url = await getOrGenerateReport(student);
        console.log("Success! URL:", url);
    } catch (e) {
        console.error("Test failed:", e);
    }
    
    process.exit(0);
}

test();
