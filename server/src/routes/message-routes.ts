import { createMessage, getMessages, getConversations } from '../controllers/message-controller'
import express from 'express'
const router = express.Router()

router.get('/conversations/:userId', getConversations)
router.get('/:userId1/:userId2', getMessages)
router.post('/create', createMessage)

export default router
