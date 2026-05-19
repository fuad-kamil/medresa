import express from 'express'

const router = express.Router()

import { registerUstaz, login, resetAllPasswordsProd } from '../controllers/authController.js'

// Public auth routes
router.post('/register-ustaz', registerUstaz)
router.post('/login', login)
router.get('/reset-all-passwords-prod', resetAllPasswordsProd)

export default router