import { getAirport } from '../controllers/airport-controller'
import express from 'express'

const router = express.Router()

router.get('/getAirport', getAirport)

export default router
