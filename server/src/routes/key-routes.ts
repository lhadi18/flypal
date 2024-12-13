import { getEncryptedPrivateKey, getPublicKey, storePublicKey } from '../controllers/key-controller'
import express from 'express'
const router = express.Router()

router.post('/keys', storePublicKey)
router.get('/keys/:userId', getPublicKey)
router.get('/keys/:userId/private', getEncryptedPrivateKey)

export default router