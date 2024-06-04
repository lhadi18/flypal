import { createRosterEntry, getAllRosterEntries } from '../controllers/roster-controller'
import express from 'express'

const router = express.Router()

router.post('/createRosterEntry', createRosterEntry)
// router.get('/getAllRosterEntries', getAllRosterEntries)

export default router
