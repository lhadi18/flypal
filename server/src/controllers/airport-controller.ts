import Airport from '../models/airport-model'
import { RequestHandler } from 'express'

export const getAirport: RequestHandler = async (req, res) => {
  const query = req.query.query

  // Check if query is a valid, non-empty string
  if (typeof query !== 'string' || query.trim().length === 0) {
    res.status(400).send('Invalid or empty query parameter')
    return
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
    })
      .limit(10)
      .lean()

    if (airports.length === 0) {
      res.status(404).json({ message: 'No airports found matching your query' })
      return
    }

    const formattedAirports = airports.map(airport => ({
      ...airport,
      id: airport._id,
      label: airport.IATA
        ? `(${airport.IATA}/${airport.ICAO}) - ${airport.name}`
        : `(${airport.ICAO}) - ${airport.name}`,
      value: airport._id,
      timezone: airport.tz_database
    }))

    res.json(formattedAirports)
  } catch (error) {
    console.error('Failed to fetch airports:', error)
    res.status(500).send('Error fetching airport data')
  }
}

export const getAirportsByIATA = async (iataCodes: string[]) => {
  try {
    const airports = await Airport.find({ IATA: { $in: iataCodes } }).lean()
    return airports
  } catch (error) {
    console.error('Error fetching airport IATA')
  }
}
