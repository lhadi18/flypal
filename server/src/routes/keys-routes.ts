import express from 'express'
import { getPublicKey } from '../controllers/keys-controller'

const router = express.Router();

// Route to get a user's public key by userId
router.get('/:userId', getPublicKey);

export default router
