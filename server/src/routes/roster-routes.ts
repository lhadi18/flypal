import {
  createRosterEntry,
  getRosterEntries,
  updateRosterEntry,
  deleteRosterEntry,
  getCurrentMonthRoster,
  getNext30DaysRoster
} from '../controllers/roster-controller'
import express from 'express'

const router = express.Router()

router.post('/createRosterEntry', createRosterEntry)
router.get('/getRosterEntries', getRosterEntries)
router.put('/updateRosterEntry/:rosterId', updateRosterEntry)
router.delete('/deleteRosterEntry/:rosterId', deleteRosterEntry)
router.get('/getCurrentMonthRoster', getCurrentMonthRoster)
router.get('/getNext30DaysRoster', getNext30DaysRoster)

export default router
