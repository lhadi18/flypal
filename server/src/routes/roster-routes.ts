import { createRosterEntry, getRosterEntries } from '../controllers/roster-controller'
import express from 'express'

const router = express.Router()

router.post('/createRosterEntry', createRosterEntry)
router.get('/getRosterEntries', getRosterEntries)

export default router
