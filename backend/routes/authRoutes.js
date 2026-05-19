import express from 'express'

const router = express.Router()

import { registerUstaz, login } from '../controllers/authController.js'

// Public auth routes
router.post('/register-ustaz', registerUstaz)
router.post('/login', login)

export default router