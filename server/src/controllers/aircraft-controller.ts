import Aircraft from '../models/aircraft-model'
import { Request, Response, RequestHandler } from 'express'
import mongoose from 'mongoose'

export const getAircraft: RequestHandler = async (req, res) => {
  try {
    const aircraft = await Aircraft.find({})
    res.status(200).json(aircraft) // Removed `return` here
  } catch (error) {
    console.error('Error fetching aircraft:', error)
    res.status(500).json({ message: 'Server error', error })
  }
}
