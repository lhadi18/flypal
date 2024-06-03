import { Request, Response } from 'express'
import mongoose from 'mongoose'

const Aircraft = require('../models/aircraft-model')

export const getAircraft = async (req: Request, res: Response) => {
  try {
    const aircraft = await Aircraft.find({})
    return res.status(200).json(aircraft)
  } catch (error) {
    res.status(500).send(error)
  }
}
