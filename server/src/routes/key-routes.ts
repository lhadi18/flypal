import { getKey, storeKey } from '../controllers/key-controller'
import express from 'express'
const router = express.Router()

router.post('/keys', storeKey)
router.get('/keys/:userId', getKey)

export default router