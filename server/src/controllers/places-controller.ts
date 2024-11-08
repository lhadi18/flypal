import { getNearbyPlaces } from '../services/google-places-services'
import { Request, Response } from 'express'

export const fetchNearbyPlaces = async (req: Request, res: Response) => {
  try {
    const { type, city, dietaryOption } = req.query

    const filteredType = dietaryOption ? dietaryOption + ' ' + type : type

    const places = await getNearbyPlaces(city as string, filteredType as string)
    res.json(places)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch nearby places' })
  }
}
