import Message from '../models/message-model'
import { Request, Response } from 'express'

// Create a new message
export const createMessage = async (req: Request, res: Response) => {
  const { sender, recipient, content } = req.body

  if (!sender || !recipient || !content) {
    return res.status(400).json({ error: 'All fields are required.' })
  }

  try {
    const message = await Message.create({
      sender,
      recipient,
      content
    })

    res.status(201).json(message)
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message.' })
  }
}

// Get all messages between two users
export const getMessages = async (req: Request, res: Response) => {
  const { userId1, userId2 } = req.params

  try {
    const messages = await Message.find({
      $or: [
        { sender: userId1, recipient: userId2 },
        { sender: userId2, recipient: userId1 }
      ]
    })
      .sort({ timestamp: 1 }) // Sort by timestamp (ascending)
      .populate('sender', 'firstName lastName profilePicture') // Populate sender details
      .populate('recipient', 'firstName lastName profilePicture') // Populate recipient details

    res.status(200).json(messages)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages.' })
  }
}
