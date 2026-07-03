import User from '../models/User.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Register Ustaz (Public)
export const registerUstaz = async (req, res) => {
    try {
        const { name, email, password, phone, stream, kitabName } = req.body
        const normalizedEmail = email?.toLowerCase().trim()

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
        const { email, password, role } = req.body
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

        // Check role match
        if (user.role !== role) {
            return res.status(403).json({
                message: `Access denied. You are not registered as ${role}.`
            })
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        )

        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                isApproved: user.isApproved,
                stream: user.stream,
                kitabName: user.kitabName
            },
            token
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}