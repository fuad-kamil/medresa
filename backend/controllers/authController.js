import User from '../models/User.js'
import Settings from '../models/Settings.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Register Ustaz (Public)
export const registerUstaz = async (req, res) => {
    try {
        const { name, email, password, phone, stream, kitabName, teachingDays, studentPhoneOption, inviteCode } = req.body
        const normalizedEmail = email?.toLowerCase().trim()

        // Verify Invitation Code
        let expectedInviteCode = process.env.REGISTRATION_INVITE_CODE || 'ALI_JOIN_2026';
        try {
            const dbInviteCode = await Settings.findOne({ key: 'REGISTRATION_INVITE_CODE' });
            if (dbInviteCode && dbInviteCode.value) {
                expectedInviteCode = dbInviteCode.value;
            }
        } catch (dbErr) {
            console.error('Failed to fetch invitation code from database settings:', dbErr);
        }

        if (!inviteCode || inviteCode.trim() !== expectedInviteCode) {
            return res.status(400).json({ message: 'Invalid or missing invitation code' })
        }

        const userExists = await User.findOne({ email: normalizedEmail })
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' })
        }

        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        const user = await User.create({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            phone,
            stream: stream || 'quran',
            kitabName: stream === 'kitab' ? kitabName : undefined,
            teachingDays: teachingDays && teachingDays.length > 0 ? teachingDays : [0, 1, 2, 3, 4, 5, 6],
            studentPhoneOption: studentPhoneOption ? Number(studentPhoneOption) : 1,
            role: 'ustaz',
            isApproved: false
        })

        res.status(201).json({
            message: 'Registration successful. Waiting for admin approval.',
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Login
export const login = async (req, res) => {
    try {
        const { email, password } = req.body
        const normalizedEmail = email?.toLowerCase().trim()

        const user = await User.findOne({ email: normalizedEmail })
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' })
        }

        // Check approval for Ustaz
        if (user.role === 'ustaz' && !user.isApproved) {
            return res.status(403).json({
                message: 'Your account is not approved by admin yet.'
            })
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        )

        res.cookie('token', token, {
            httpOnly: true,
            maxAge: 604800000,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'strict'
        });

        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                isApproved: user.isApproved,
                stream: user.stream,
                kitabName: user.kitabName,
                teachingDays: user.teachingDays,
                studentPhoneOption: user.studentPhoneOption || 1,
                semesterStatus: user.semesterStatus || 'active'
            },
            token
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}