import { fetchNearbyPlaces } from '../controllers/places-controller'
import express from 'express'

const router = express.Router()

router.get('/fetchNearbyPlaces', fetchNearbyPlaces)

export default router
