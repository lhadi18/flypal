import Message from '../models/message-model'
import { Request, Response } from 'express'
import mongoose from 'mongoose'

// Create a new message
export const createMessage = async (req: Request, res: Response): Promise<void> => {
  const { sender, recipient, content } = req.body

  if (!sender || !recipient || !content) {
    res.status(400).json({ error: 'All fields are required.' })
    return // Ensure early exit
  }

  try {
    const message = await Message.create({
      sender,
      recipient,
      content
    })

    res.status(201).json(message)
  } catch (error) {
    console.error('Error creating message:', error)
    res.status(500).json({ error: 'Failed to send message.' })
  }
}

export const getConversations = async (req: Request, res: Response) => {
  const { userId } = req.params

  try {
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: new mongoose.Types.ObjectId(userId) }, { recipient: new mongoose.Types.ObjectId(userId) }]
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $lt: ['$sender', '$recipient'] },
              { sender: '$sender', recipient: '$recipient' },
              { sender: '$recipient', recipient: '$sender' }
            ]
          },
          lastMessage: { $last: '$content' },
          lastTimestamp: { $last: '$timestamp' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id.sender',
          foreignField: '_id',
          as: 'senderDetails'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id.recipient',
          foreignField: '_id',
          as: 'recipientDetails'
        }
      },
      {
        $lookup: {
          from: 'airports',
          localField: 'senderDetails.homebase',
          foreignField: '_id',
          as: 'senderHomebaseDetails'
        }
      },
      {
        $lookup: {
          from: 'airports',
          localField: 'recipientDetails.homebase',
          foreignField: '_id',
          as: 'recipientHomebaseDetails'
        }
      },
      {
        $lookup: {
          from: 'roles',
          localField: 'senderDetails.role',
          foreignField: '_id',
          as: 'senderRoleDetails'
        }
      },
      {
        $lookup: {
          from: 'roles',
          localField: 'recipientDetails.role',
          foreignField: '_id',
          as: 'recipientRoleDetails'
        }
      },
      {
        $lookup: {
          from: 'airlines',
          localField: 'senderDetails.airline',
          foreignField: '_id',
          as: 'senderAirlineDetails'
        }
      },
      {
        $lookup: {
          from: 'airlines',
          localField: 'recipientDetails.airline',
          foreignField: '_id',
          as: 'recipientAirlineDetails'
        }
      },
      {
        $project: {
          _id: 0,
          sender: {
            _id: { $arrayElemAt: ['$senderDetails._id', 0] },
            airline: { $arrayElemAt: ['$senderAirlineDetails', 0] },
            email: { $arrayElemAt: ['$senderDetails.email', 0] },
            firstName: { $arrayElemAt: ['$senderDetails.firstName', 0] },
            homebase: { $arrayElemAt: ['$senderHomebaseDetails', 0] },
            lastName: { $arrayElemAt: ['$senderDetails.lastName', 0] },
            profilePicture: { $arrayElemAt: ['$senderDetails.profilePicture', 0] },
            role: {
              _id: { $arrayElemAt: ['$senderRoleDetails._id', 0] },
              label: { $arrayElemAt: ['$senderRoleDetails.label', 0] },
              value: { $arrayElemAt: ['$senderRoleDetails.value', 0] }
            }
          },
          recipient: {
            _id: { $arrayElemAt: ['$recipientDetails._id', 0] },
            airline: { $arrayElemAt: ['$recipientAirlineDetails', 0] },
            email: { $arrayElemAt: ['$recipientDetails.email', 0] },
            firstName: { $arrayElemAt: ['$recipientDetails.firstName', 0] },
            homebase: { $arrayElemAt: ['$recipientHomebaseDetails', 0] },
            lastName: { $arrayElemAt: ['$recipientDetails.lastName', 0] },
            profilePicture: { $arrayElemAt: ['$recipientDetails.profilePicture', 0] },
            role: {
              _id: { $arrayElemAt: ['$recipientRoleDetails._id', 0] },
              label: { $arrayElemAt: ['$recipientRoleDetails.label', 0] },
              value: { $arrayElemAt: ['$recipientRoleDetails.value', 0] }
            }
          },
          lastMessage: 1,
          lastTimestamp: 1
        }
      }
    ])

    res.status(200).json(conversations)
  } catch (error) {
    console.error('Error fetching conversations:', error)
    res.status(500).json({ error: 'Failed to fetch conversations.' })
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

export const markMessagesAsRead = async (req: Request, res: Response) => {
  const { senderId, recipientId } = req.params

  try {
    const result = await Message.updateMany(
      {
        sender: senderId,
        recipient: recipientId,
        read: false
      },
      { $set: { read: true } }
    )

    res.status(200).json({ success: true, updatedCount: result.modifiedCount })
  } catch (error) {
    console.error('Error marking messages as read:', error)
    res.status(500).json({ error: 'Failed to mark messages as read.' })
  }
}
