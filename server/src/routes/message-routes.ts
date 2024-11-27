import { createMessage, getMessages, getConversations, markMessagesAsRead } from '../controllers/message-controller'
import express from 'express'
const router = express.Router()

router.get('/conversations/:userId', getConversations)
router.get('/:userId1/:userId2', getMessages)
router.post('/create', createMessage)
router.patch('/read/:senderId/:recipientId', markMessagesAsRead)

export default router
