// backend/routes/seedRoutes.js
import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

router.post('/create-admin', async (req, res) => {
    try {
        const email = req.body.email || process.env.ADMIN_EMAIL;
        const password = req.body.password || process.env.ADMIN_PASSWORD;

        if (!email || !password) {
            return res.status(400).json({ message: "Admin email and password must be provided via request body or .env" });
        }

        // Delete existing admin first (for clean testing)
        await User.deleteOne({ email });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const admin = await User.create({
            name: req.body.name || "Super Admin",
            email: email,
            password: hashedPassword,
            role: "admin",
            isApproved: true,
            phone: req.body.phone || "0912345678"
        });

        res.status(201).json({
            success: true,
            message: "New Admin Created Successfully!",
            loginInfo: {
                email: email
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;