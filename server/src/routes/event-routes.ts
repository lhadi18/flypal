import { getEvents } from '../controllers/event-controller'
import express from 'express'

const router = express.Router()

router.get('/getEvents', getEvents)

export default router
