import { fetchEvents } from '../services/event-service';
import { Request, Response } from 'express';

export const getEvents = async (req: Request, res: Response): Promise<void> => {
  const city = req.query.city as string | undefined; // Explicitly allow undefined
  const country = req.query.country as string | undefined; // Explicitly allow undefined

  if (!city || !country) {
    res.status(400).send({ error: 'City and country parameters are required' });
    return; // Ensure we return to prevent further execution
  }

  try {
    const events = await fetchEvents(city, country);
    res.send({ events });
  } catch (error) {
    console.error(error); // Log error for debugging
    res.status(500).send({ error: 'Failed to fetch events' });
  }
};
