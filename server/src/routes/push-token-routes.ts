import { savePushToken, deletePushToken, deletePushTokenForDevice } from '../controllers/push-token-controller'
import express from 'express'

const router = express.Router()

router.post('/save', savePushToken)
router.delete('/delete', deletePushToken)
router.post('/delete-device', deletePushTokenForDevice)

export default router
