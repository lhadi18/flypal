import { getAirlines, canUploadRoster } from '../controllers/airline-controller'
import { Router } from 'express'

const router: Router = Router()

router.get('/getAirlines', getAirlines)
router.get('/:userId/canUploadRoster', canUploadRoster)

export default router
