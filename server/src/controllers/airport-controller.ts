import { Request, Response } from 'express'

const Airport = require('../models/airport-model')

export const getAirport = async (req: Request, res: Response) => {
  const query = req.query.query

  if (typeof query !== 'string') {
    res.status(400).send('Invalid query parameter')
    return
  }

  try {
    const airports = await Airport.find({
      $or: [{ ident: new RegExp(query, 'i') }, { name: new RegExp(query, 'i') }, { iata_code: new RegExp(query, 'i') }]
    }).lean() // Use lean() for faster performance as we only need to process the data

    const formattedAirports = airports.map((airport: { iata_code: any; ident: any; name: any }) => ({
      ...airport,
      display: airport.iata_code
        ? `(${airport.iata_code}/${airport.ident}) - ${airport.name}`
        : `(${airport.ident}) - ${airport.name}`
    }))

    res.json(formattedAirports)
  } catch (error) {
    console.error('Failed to fetch airports:', error)
    res.status(500).send('Error fetching airport data')
  }
}
