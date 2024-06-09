import { registerUser, loginUser, validateUserId, getUserDetails } from '../controllers/user-controller'
import express from 'express'

const router = express.Router()

router.post('/register', registerUser)
router.post('/login', loginUser)
router.post('/validateUserId', validateUserId)
router.get('/getUserId', getUserDetails);

export default router
