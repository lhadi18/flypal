import Roster from '../models/roster-model'
import { Request, Response } from 'express'

export const createRosterEntry = async (req: Request, res: Response) => {
  try {
    const { userId, type, origin, destination, departureTime, arrivalTime, flightNumber, aircraftType, notes } =
      req.body
    const newEntry = new Roster({
      userId,
      type,
      origin,
      destination,
      departureTime,
      arrivalTime,
      flightNumber,
      aircraftType,
      notes
    })

    await newEntry.save()
    res.status(201).json(newEntry)
  } catch (error: any) {
    res.status(400).json({ error: error.message })
  }
}

export const getAllRosterEntries = async (req: Request, res: Response) => {
  try {
    const entries = await Roster.find().exec()
    res.status(200).json(entries)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching roster entries', error })
  }
}
