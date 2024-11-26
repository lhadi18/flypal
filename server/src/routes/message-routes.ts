import { createMessage, getMessages } from '../controllers/message-controller'
import express from 'express'
const router = express.Router()

router.post('/create', createMessage)
router.get('/:userId1/:userId2', getMessages)

export default router
