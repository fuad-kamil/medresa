import User from '../models/User.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// Register Ustaz (Public)
export const registerUstaz = async (req, res) => {
    try {
        const { name, email, password, phone, stream } = req.body
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
            { expiresIn: '7d' }
        )

        res.json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isApproved: user.isApproved,
                stream: user.stream
            },
            token
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// Reset all passwords in active database to admin123
export const resetAllPasswordsProd = async (req, res) => {
    try {
        const users = await User.find({})
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash('admin123', salt)

        for (const user of users) {
            user.password = hashedPassword
            await user.save()
        }

        res.json({
            success: true,
            message: `Successfully reset passwords to 'admin123' for ${users.length} users in the active database!`
        })
    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}