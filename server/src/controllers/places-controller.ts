import { getNearbyPlaces } from '../services/google-places-services'
import { Request, Response } from 'express'

export const fetchNearbyPlaces = async (req: Request, res: Response) => {
  try {
    const { latitude, longitude, radius, type } = req.query

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and Longitude are required' })
    }

    const places = await getNearbyPlaces(latitude as string, longitude as string, radius as string, type as string)
    res.json(places)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch nearby places' })
  }
}
