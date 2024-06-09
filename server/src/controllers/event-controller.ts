import { fetchEvents } from '../services/event-service'
import { Request, Response } from 'express'

export const getEvents = async (req: Request, res: Response) => {
  const city = req.query.city as string
  const country = req.query.country as string

  if (!city || !country) {
    return res.status(400).send({ error: 'City and country parameters are required' })
  }

  try {
    const events = await fetchEvents(city, country)
    res.send({ events })
  } catch (error) {
    res.status(500).send({ error: 'Failed to fetch events' })
  }
}
