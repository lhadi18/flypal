import { Request, Response } from 'express'
import User from '../models/user-model'
import mongoose from 'mongoose'

export const registerUser = async (req: Request, res: Response) => {
  const { firstName, lastName, email, password, homebase, airline, role } = req.body

  try {
    const userExists = await User.findOne({ email })

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' })
    }

    const user = new User({
      firstName,
      lastName,
      email,
      password,
      homebase,
      airline,
      role
    })

    await user.save()

    res.status(201).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      homebase: user.homebase,
      airline: user.airline,
      role: user.role
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body

  try {
    const user = await User.findOne({ email }).populate('homebase').populate('airline')

    if (user && (await user.matchPassword(password))) {
      res.status(200).json({
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        homebase: user.homebase,
        airline: user.airline,
        role: user.role
      })
    } else {
      res.status(401).json({ message: 'Invalid email or password' })
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

export const validateUserId = async (req: Request, res: Response) => {
  const { userId } = req.body

  if (!userId) {
    // return res.status(400).json({ message: 'User ID is required' })
    return
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid User ID' })
  }

  try {
    const user = await User.findById(userId)

    if (user) {
      return res.status(200).json({ _id: user._id })
    } else {
      return res.status(404).json({ message: 'User not found' })
    }
  } catch (error) {
    console.error('Error validating user ID:', error)
    return res.status(500).json({ message: 'Server error' })
  }
}
