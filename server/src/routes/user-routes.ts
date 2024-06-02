import { registerUser, loginUser, validateUserId } from '../controllers/user-controller'
import express from 'express'

const router = express.Router()

router.post('/register', registerUser)
router.post('/login', loginUser)
router.post('/validateUserId', validateUserId)

export default router
