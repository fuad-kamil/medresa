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