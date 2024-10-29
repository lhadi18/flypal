import { Request, Response } from 'express'
import Role from '../models/role-model'

export const getAllRoles = async (req: Request, res: Response): Promise<void> => {
  try {
    const roles = await Role.find()
    res.status(200).json(roles)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch roles' })
  }
}
