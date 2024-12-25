import { savePushToken, deletePushToken } from '../controllers/push-token-controller'
import express from 'express'

const router = express.Router()

router.post('/save', savePushToken)
router.delete('/delete', deletePushToken)

export default router
