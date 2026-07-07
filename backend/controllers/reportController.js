import Student from '../models/Student.js';
import Exam from '../models/Exam.js';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import { generateReportPDF } from '../utils/generateReportPDF.js';
import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';

// Ensure cloudinary is configured
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

// Helper: compute hash of scores
const computeScoresHash = (scores) => {
    // scores is a Map or Object, sort keys to be consistent
    const keys = Object.keys(scores).sort();
    let str = "";
    for (const k of keys) {
        str += `${k}:${scores[k]}|`;
    }
    return crypto.createHash('md5').update(str).digest('hex');
};

const processStudentReport = async (studentId) => {
    const student = await Student.findById(studentId).populate('assignedUstaz');
    if (!student) throw new Error('Student not found');
    
    // Fetch Exams
    const ustazId = student.assignedUstaz?._id;
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
    
    if (stats.length > 0) {
        student.presentCount = stats[0].presentCount;
        student.absentCount = stats[0].absentCount;
        student.excusedCount = stats[0].excusedCount;
    }

    // Convert student examScores (Mongoose Map) to plain object
    const plainScores = {};
    if (student.examScores) {
        for (const [key, value] of student.examScores.entries()) {
            plainScores[key] = value;
        }
    }
    
    const currentHash = computeScoresHash(plainScores);
    
    // Check if we need to regenerate
    if (student.reportCardUrl && student.reportScoresHash === currentHash) {
        return student.reportCardUrl; // Already up to date
    }

    // Need to regenerate. First figure out Rank and total students.
    // For rank, we'd need all students for this ustaz, but it might be heavy. 
    // We'll skip exact rank calculation for the backend PDF for speed, or pass it if possible.
    // Actually, skipping rank or computing it simply:
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

    // Generate PDF
    const ustazName = student.assignedUstaz?.name;
    const kitabName = student.assignedUstaz?.kitabName || student.stream;
    
    const pdfBytes = await generateReportPDF(student, exams, plainScores, rank, totalStudents, ustazName, kitabName);
    
    // Upload to Cloudinary using a stream
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { 
                folder: 'medresa/report_cards',
                resource_type: 'raw',
                format: 'pdf',
                public_id: `report_${student._id}_${Date.now()}` // Unique ID
            }, 
            async (error, result) => {
                if (error) {
                    console.error("Cloudinary Upload Error:", error);
                    return reject(error);
                }
                
                // If old PDF existed, delete it
                if (student.reportCardPublicId) {
                    try {
                        await cloudinary.uploader.destroy(student.reportCardPublicId, { resource_type: 'raw' });
                    } catch(e) {
                        console.error("Failed to delete old PDF:", e);
                    }
                }

                // Update student record
                student.reportCardUrl = result.secure_url;
                student.reportCardPublicId = result.public_id;
                student.reportScoresHash = currentHash;
                student.reportCardGeneratedAt = new Date();
                await student.save();

                resolve(result.secure_url);
            }
        );
        
        // Write buffer to stream
        uploadStream.end(Buffer.from(pdfBytes));
    });
};

export const sendStudentReport = async (req, res) => {
    try {
        const { id } = req.params;
        const url = await processStudentReport(id);
        res.json({ success: true, url, message: 'Report card generated successfully.' });
    } catch (error) {
        console.error("sendStudentReport error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const sendAllReports = async (req, res) => {
    try {
        const { ustazId } = req.body;
        if (!ustazId) return res.status(400).json({ success: false, message: 'Ustaz ID is required.' });

        const students = await Student.find({ assignedUstaz: ustazId });
        
        let successCount = 0;
        let failCount = 0;

        // Process sequentially to save RAM
        for (const student of students) {
            try {
                await processStudentReport(student._id);
                successCount++;
            } catch (err) {
                console.error(`Failed for student ${student._id}:`, err);
                failCount++;
            }
        }

        res.json({ success: true, successCount, failCount, message: `Processed ${successCount} successfully, ${failCount} failed.` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const cleanupOldReports = async (req, res) => {
    try {
        // Admin-triggered: delete ALL report card PDFs (no time filter)
        const students = await Student.find({
            reportCardPublicId: { $exists: true, $ne: null }
        });

        let deletedCount = 0;
        let failCount = 0;

        for (const student of students) {
            try {
                await cloudinary.uploader.destroy(student.reportCardPublicId, { resource_type: 'raw' });
                student.reportCardUrl = undefined;
                student.reportCardPublicId = undefined;
                student.reportScoresHash = undefined;
                student.reportCardGeneratedAt = undefined;
                await student.save();
                deletedCount++;
            } catch (err) {
                console.error(`Failed to delete Cloudinary PDF for student ${student._id}:`, err);
                failCount++;
            }
        }

        res.json({ 
            success: true, 
            deletedCount, 
            failCount,
            message: `Deleted ${deletedCount} report card PDF(s) from Cloudinary.${failCount > 0 ? ` ${failCount} failed.` : ''}`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
