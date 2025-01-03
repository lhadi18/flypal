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
  const { userId } = req.params;

  try {
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: new mongoose.Types.ObjectId(userId) },
            { recipient: new mongoose.Types.ObjectId(userId) },
          ],
        },
      },
      {
        $sort: { timestamp: -1 }, // Sort messages by timestamp descending
      },
      {
        $group: {
          _id: {
            $cond: [
              { $lt: ['$sender', '$recipient'] },
              { sender: '$sender', recipient: '$recipient' },
              { sender: '$recipient', recipient: '$sender' },
            ],
          },
          lastMessage: { $first: '$encryptedContent' },
          lastNonce: { $first: '$nonce' },
          lastTimestamp: { $first: '$timestamp' },
          senderId: { $first: '$sender' },
          recipientId: { $first: '$recipient' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'senderId',
          foreignField: '_id',
          as: 'senderDetails',
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'recipientId',
          foreignField: '_id',
          as: 'recipientDetails',
        },
      },
      // Lookup for sender's homebase, airline, and role
      {
        $lookup: {
          from: 'airports',
          localField: 'senderDetails.homebase',
          foreignField: '_id',
          as: 'senderHomebase',
        },
      },
      {
        $lookup: {
          from: 'airlines',
          localField: 'senderDetails.airline',
          foreignField: '_id',
          as: 'senderAirline',
        },
      },
      {
        $lookup: {
          from: 'roles',
          localField: 'senderDetails.role',
          foreignField: '_id',
          as: 'senderRole',
        },
      },
      // Lookup for recipient's homebase, airline, and role
      {
        $lookup: {
          from: 'airports',
          localField: 'recipientDetails.homebase',
          foreignField: '_id',
          as: 'recipientHomebase',
        },
      },
      {
        $lookup: {
          from: 'airlines',
          localField: 'recipientDetails.airline',
          foreignField: '_id',
          as: 'recipientAirline',
        },
      },
      {
        $lookup: {
          from: 'roles',
          localField: 'recipientDetails.role',
          foreignField: '_id',
          as: 'recipientRole',
        },
      },
      {
        $project: {
          _id: 0,
          sender: {
            _id: { $arrayElemAt: ['$senderDetails._id', 0] },
            firstName: { $arrayElemAt: ['$senderDetails.firstName', 0] },
            lastName: { $arrayElemAt: ['$senderDetails.lastName', 0] },
            email: { $arrayElemAt: ['$senderDetails.email', 0]},
            profilePicture: { $arrayElemAt: ['$senderDetails.profilePicture', 0] },
            homebase: {
              IATA: { $arrayElemAt: ['$senderHomebase.IATA', 0] },
              ICAO: { $arrayElemAt: ['$senderHomebase.ICAO', 0] },
              city: { $arrayElemAt: ['$senderHomebase.city', 0] },
            },
            airline: {
              ICAO: { $arrayElemAt: ['$senderAirline.ICAO', 0] },
              Name: { $arrayElemAt: ['$senderAirline.Name', 0] },
            },
            role: { value: { $arrayElemAt: ['$senderRole.value', 0] } },
          },
          recipient: {
            _id: { $arrayElemAt: ['$recipientDetails._id', 0] },
            firstName: { $arrayElemAt: ['$recipientDetails.firstName', 0] },
            lastName: { $arrayElemAt: ['$recipientDetails.lastName', 0] },
            email: { $arrayElemAt: ['$recipientDetails.email', 0]},
            profilePicture: { $arrayElemAt: ['$recipientDetails.profilePicture', 0] },
            homebase: {
              IATA: { $arrayElemAt: ['$recipientHomebase.IATA', 0] },
              ICAO: { $arrayElemAt: ['$recipientHomebase.ICAO', 0] },
              city: { $arrayElemAt: ['$recipientHomebase.city', 0] },
            },
            airline: {
              ICAO: { $arrayElemAt: ['$recipientAirline.ICAO', 0] },
              Name: { $arrayElemAt: ['$recipientAirline.Name', 0] },
            },
            role: { value: { $arrayElemAt: ['$recipientRole.value', 0] } },
          },
          lastMessage: 1,
          lastNonce: 1,
          lastTimestamp: 1,
        },
      },
      { $sort: { lastTimestamp: -1 } }, // Sort final conversations by last message timestamp
    ]);

    res.status(200).json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations.' });
  }
};

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
  const { senderId, recipientId, messageIds } = req.body

  try {
    const result = await Message.updateMany(
      { _id: { $in: messageIds }, sender: recipientId, recipient: senderId, read: false },
      { $set: { read: true } }
    )

    res.status(200).json({ success: true, updatedCount: result.modifiedCount })
  } catch (error) {
    console.error('Error marking messages as read:', error)
    res.status(500).json({ error: 'Failed to mark messages as read.' })
  }
}

export const deleteMessages = async (req: Request, res: Response) => {
  const { userId, otherUserId } = req.body

  try {
    // Delete messages where either the logged-in user is the sender or recipient
    await Message.deleteMany({
      $or: [
        { sender: userId, recipient: otherUserId },
        { sender: otherUserId, recipient: userId }
      ]
    })

    return res.status(200).json({ message: 'Conversation deleted successfully' })
  } catch (error) {
    console.error('Error deleting conversation:', error)
    return res.status(500).json({ error: 'Failed to delete conversation' })
  }
}
