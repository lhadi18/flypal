import PushToken from '../models/push-token-model'
import { Request, Response } from 'express'
import mongoose from 'mongoose'

// Save or update a push token
export const savePushToken = async (req: Request, res: Response): Promise<void> => {
  const { userId, token, deviceId } = req.body

  if (!userId || !token || !deviceId) {
    res.status(400).json({ message: 'userId, token, and deviceId are required' })
    return
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: 'Invalid userId' })
    return
  }

  try {
    // Check if the token already exists for this user and device
    const existingToken = await PushToken.findOne({ userId, deviceId })

    if (existingToken) {
      // Update the existing token
      existingToken.token = token
      existingToken.updatedAt = new Date()
      await existingToken.save()
      res.status(200).json({ message: 'Push token updated successfully' })
    } else {
      // Save a new push token
      const newToken = new PushToken({ userId, token, deviceId })
      await newToken.save()
      res.status(201).json({ message: 'Push token saved successfully' })
    }
  } catch (error) {
    console.error('Error saving push token:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Delete a push token
export const deletePushToken = async (req: Request, res: Response): Promise<void> => {
  const { userId, deviceId } = req.body

  if (!userId || !deviceId) {
    res.status(400).json({ message: 'userId and deviceId are required' })
    return
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: 'Invalid userId' })
    return
  }

  try {
    const result = await PushToken.findOneAndDelete({ userId, deviceId })

    if (result) {
      res.status(200).json({ message: 'Push token deleted successfully' })
    } else {
      res.status(404).json({ message: 'Push token not found' })
    }
  } catch (error) {
    console.error('Error deleting push token:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getPushTokensForUser = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params

  if (!userId) {
    res.status(400).json({ message: 'userId is required' })
    return
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: 'Invalid userId' })
    return
  }

  try {
    const pushTokens = await PushToken.find({ userId })

    if (pushTokens.length === 0) {
      res.status(404).json({ message: 'No push tokens found for the user' })
      return
    }

    res.status(200).json({ pushTokens })
  } catch (error) {
    console.error('Error fetching push tokens:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const deletePushTokenForDevice = async (req: Request, res: Response): Promise<void> => {
  const { userId, deviceId } = req.body

  if (!userId || !deviceId) {
    res.status(400).json({ message: 'userId and deviceId are required' })
    return
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: 'Invalid userId' })
    return
  }

  try {
    const result = await PushToken.findOneAndDelete({ userId, deviceId })

    if (result) {
      res.status(200).json({ message: 'Push token deleted successfully for the specific device' })
    } else {
      res.status(404).json({ message: 'Push token not found for the specific device' })
    }
  } catch (error) {
    console.error('Error deleting push token for device:', error)
    res.status(500).json({ message: 'Server error' })
  }
}
