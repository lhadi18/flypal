import Airline from '../models/airline-model'
import { Request, Response } from 'express'

export const getAirlines = async (req: Request, res: Response): Promise<void> => {
  const query = req.query.query

  if (typeof query !== 'string' || query.trim().length === 0) {
    res.status(400).send('Invalid or empty query parameter')
    return
  }

  try {
    const regexQuery = new RegExp(query.trim(), 'i')
    const airlines = await Airline.find({
      $and: [
        { Active: 'Y' },
        {
          $or: [
            { Name: regexQuery },
            { IATA: regexQuery },
            { ICAO: regexQuery },
            { Callsign: regexQuery },
            { Country: regexQuery }
          ]
        }
      ]
    })
      .limit(10)
      .lean()

    if (airlines.length === 0) {
      res.status(404).json({ message: 'No airlines found matching your query' })
      return
    }

    const formattedAirlines = airlines.map(airline => ({
      ...airline,
      id: airline._id, // Add the virtual `id` field
      label: `${airline.Name} (${airline.IATA}/${airline.ICAO}) - ${airline.Callsign}`,
      value: airline._id
    }))

    res.json(formattedAirlines)
  } catch (error) {
    console.error('Failed to fetch airlines:', error)
    res.status(500).send('Error fetching airline data')
  }
}
