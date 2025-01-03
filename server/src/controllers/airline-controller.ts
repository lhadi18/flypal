import Airline from '../models/airline-model'
import { Request, Response } from 'express'
import User from '../models/user-model'

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

export const canUploadRoster = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.userId

    if (!userId) {
      res.status(400).json({ message: 'User ID is required' })
      return
    }

    const user = await User.findById(userId).populate('airline').lean()

    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    if (!user.airline) {
      res.status(404).json({ message: 'User is not associated with an airline' })
      return
    }

    const airline = await Airline.findById(user.airline).lean()

    if (!airline) {
      res.status(404).json({ message: 'Associated airline not found' })
      return
    }

    if (airline.canUploadRoster) {
      res.status(200).json({ message: 'The airline can upload rosters', canUploadRoster: true })
    } else {
      res.status(200).json({ message: 'The airline cannot upload rosters', canUploadRoster: false })
    }
  } catch (error) {
    console.error('Error checking roster upload permission:', error)
    res.status(500).json({ message: 'Server error while checking roster upload permission' })
  }
}
