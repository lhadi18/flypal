import {
  createRosterEntry,
  getRosterEntries,
  updateRosterEntry,
  deleteRosterEntry
} from '../controllers/roster-controller'
import express from 'express'

const router = express.Router()

router.post('/createRosterEntry', createRosterEntry)
router.get('/getRosterEntries', getRosterEntries)
router.put('/updateRosterEntry/:rosterId', updateRosterEntry)
router.delete('/deleteRosterEntry/:rosterId', deleteRosterEntry)

export default router
