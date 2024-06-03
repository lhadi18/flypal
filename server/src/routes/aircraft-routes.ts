import { getAircraft } from '../controllers/aircraft-controller'
import express from 'express'

const router = express.Router()

router.get('/getAircraft', getAircraft)

export default router
