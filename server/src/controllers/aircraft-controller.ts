import Aircraft from '../models/aircraft-model'
import { Request, Response } from 'express'
import mongoose from 'mongoose'

export const getAircraft = async (req: Request, res: Response) => {
  try {
    const aircraft = await Aircraft.find({})
    return res.status(200).json(aircraft)
  } catch (error) {
    res.status(500).send(error)
  }
}
