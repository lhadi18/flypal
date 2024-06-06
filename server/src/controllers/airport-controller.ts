import Airport from '../models/airport-model' // Assuming default export
import { Request, Response } from 'express'

export const getAirport = async (req: Request, res: Response) => {
  const query = req.query.query

  if (typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).send('Invalid or empty query parameter')
  }

  try {
    const regexQuery = new RegExp(query.trim(), 'i')
    const airports = await Airport.find({
      $or: [
        { name: regexQuery },
        { ICAO: regexQuery },
        { IATA: regexQuery },
        { city: regexQuery },
        { country: regexQuery }
      ]
    }).lean()

    if (airports.length === 0) {
      return res.status(404).json({ message: 'No airports found matching your query' })
    }

    const formattedAirports = airports.map(airport => ({
      label: airport.IATA
        ? `(${airport.IATA}/${airport.ICAO}) - ${airport.name}`
        : `(${airport.ICAO}) - ${airport.name}`,
      value: airport._id,
      timezone: airport.tz_database // Include timezone in the response
    }))

    res.json(formattedAirports)
  } catch (error) {
    console.error('Failed to fetch airports:', error)
    res.status(500).send('Error fetching airport data')
  }
}
