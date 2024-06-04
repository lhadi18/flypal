import Roster from '../models/roster-model'
import { Request, Response } from 'express'
import mongoose from 'mongoose'

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

export const getRosterEntries = async (req: Request, res: Response) => {
  const { userId, startDate, endDate } = req.query

  if (typeof userId !== 'string' || typeof startDate !== 'string' || typeof endDate !== 'string') {
    return res.status(400).json({ error: 'Invalid query parameters' })
  }

  if (!userId || !startDate || !endDate) {
    return res.status(400).json({ error: 'Missing required parameters' })
  }

  try {
    const parsedUserId = new mongoose.Types.ObjectId(userId)
    const parsedStartDate = new Date(startDate)
    const parsedEndDate = new Date(endDate)

    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' })
    }

    const rosters = await Roster.find({
      userId: parsedUserId,
      departureTime: { $gte: parsedStartDate, $lte: parsedEndDate }
    }).populate('origin destination aircraftType')

    res.json(rosters)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch roster entries' })
  }
}
