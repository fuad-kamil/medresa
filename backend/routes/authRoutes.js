import express from 'express'
import rateLimit from 'express-rate-limit'

const router = express.Router()

import { registerUstaz, login } from '../controllers/authController.js'

// Rate Limiters
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 login requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many login attempts. Please try again after 15 minutes.'
    }
})

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // limit each IP to 3 register requests per hour
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many registration attempts. Please try again after an hour.'
    }
})

// Public auth routes (rate-limited)
router.post('/register-ustaz', registerLimiter, registerUstaz)
router.post('/login', loginLimiter, login)

export default router