import { getAirlines } from '../controllers/airline-controller'
import { Router } from 'express'

const router: Router = Router()

router.get('/getAirlines', getAirlines)

export default router
