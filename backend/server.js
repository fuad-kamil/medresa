import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import seedRoutes from './routes/seedRoutes.js';
import sendEmail from './utils/sendEmail.js';

// Add this route with other routes

import connectDB from './config/db.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import ustazRoutes from './routes/ustazRoutes.js';
import examRoutes from './routes/examRoutes.js';

dotenv.config();
const app = express();
app.use('/api/seed', seedRoutes);
// Middleware
app.use(express.json());
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'unsafe-none' },
}));
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ustaz', ustazRoutes);
app.use('/api/exams', examRoutes);

// Test Route for Email
app.get('/api/test-email', async (req, res) => {
    try {
        console.log("Running manual email test route...");
        const recipient = process.env.ALERT_EMAIL_RECIPIENT || process.env.EMAIL_USER;
        const result = await sendEmail({
            to: recipient,
            subject: "Test Email from Ali Medresa System",
            text: "If you receive this, email sending works perfectly!",
            html: "<h1>Test Email</h1><p>Email configuration is working successfully.</p>"
        });
        
        res.json({
            success: result.success,
            recipient,
            result,
            envChecks: {
                hasResendKey: !!process.env.RESEND_API_KEY,
                hasEmailUser: !!process.env.EMAIL_USER,
                hasEmailPass: !!process.env.EMAIL_PASS,
                hasEmailApiUrl: !!process.env.EMAIL_API_URL
            }
        });
    } catch (err) {
        res.status(500).json({ 
            success: false, 
            error: err.message 
        });
    }
});

// Route to manually scan and trigger alerts for all current 3-consecutive-absent students
import Student from './models/Student.js';
import Attendance from './models/Attendance.js';
import buildAbsenceEmail from './utils/absenceEmailTemplate.js';

app.get('/api/trigger-alerts', async (req, res) => {
    try {
        console.log("Running bulk consecutive absence check...");
        const students = await Student.find().populate('assignedUstaz');
        const recipient = process.env.ALERT_EMAIL_RECIPIENT || process.env.EMAIL_USER;
        const triggeredStudents = [];

        for (const student of students) {
            const recentRecords = await Attendance.find({ student: student._id })
                .sort({ date: -1 })
                .limit(10);

            // Filter to get only the latest record per unique calendar day
            const uniqueDays = [];
            const seenDates = new Set();

            for (const record of recentRecords) {
                const dayStr = new Date(record.date).toISOString().split('T')[0];
                if (!seenDates.has(dayStr)) {
                    seenDates.add(dayStr);
                    uniqueDays.push(record);
                }
                if (uniqueDays.length === 3) break;
            }

            if (
                uniqueDays.length === 3 &&
                uniqueDays.every(att => att.status === 'absent')
            ) {
                const ustazName = student.assignedUstaz ? student.assignedUstaz.name : "Unassigned";
                const emailContent = buildAbsenceEmail(student, ustazName);
                
                await sendEmail({
                    to: recipient,
                    subject: emailContent.subject,
                    text: emailContent.text,
                    html: emailContent.html,
                });

                triggeredStudents.push({
                    name: student.fullName,
                    ustaz: ustazName,
                    fatherPhone: student.fatherPhone,
                    motherPhone: student.motherPhone
                });
            }
        }

        res.json({
            success: true,
            recipient,
            triggeredCount: triggeredStudents.length,
            triggeredStudents
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// Test Route
app.get('/', (req, res) => {
    res.send(`
    <h1>Ali Medresa Backend</h1>
    <p>Server is running successfully!</p>
  `);
});

// 404 Handler - Fixed
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong on the server!'
    });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
            console.log(` Ali Medresa Backend is Ready!`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
    }
};

startServer();