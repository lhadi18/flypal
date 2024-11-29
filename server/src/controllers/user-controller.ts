import DiningRecommendation from '../models/dining-recommendation-model'
import Checklist from '../models/checklist-model'
import Bookmark from '../models/bookmark-model'
import Message from '../models/message-model'
import Roster from '../models/roster-model'
import { Request, Response } from 'express'
import { bucket } from '../services/gcs'
import User from '../models/user-model'
import { v4 as uuidv4 } from 'uuid'
import mongoose from 'mongoose'
import multer from 'multer'

const DEFAULT_PROFILE_PICTURE_URL = 'https://storage.googleapis.com/flypal/profile-pictures/default-profile-picture.jpg'

export const registerUser = async (req: Request, res: Response): Promise<void> => {
  const { firstName, lastName, email, password, homebase, airline, role } = req.body

  try {
    const userExists = await User.findOne({ email })

    if (userExists) {
      res.status(400).json({ message: 'User already exists' })
      return
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
    console.error('Error registering user:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body

  try {
    const user = await User.findOne({ email }).populate('homebase').populate('airline').populate('role', 'value')

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

export const validateUserId = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.body

  if (!userId) {
    res.status(400).json({ message: 'User ID is required' })
    return
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: 'Invalid User ID' })
    return
  }

  try {
    const user = await User.findById(userId)

    if (user) {
      res.status(200).json({ _id: user._id })
    } else {
      res.status(404).json({ message: 'User not found' })
    }
  } catch (error) {
    console.error('Error validating user ID:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getUserDetails = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.query

  if (typeof userId !== 'string' || !mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: 'Invalid User ID' })
    return
  }

  try {
    const user = await User.findById(userId)
      .populate('role', 'value')
      .populate('homebase', 'IATA ICAO city')
      .populate('airline', 'ICAO Name')
      .select('-password')

    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    res.status(200).json(user)
  } catch (error) {
    console.error('Error fetching user details:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Update user details
export const updateUserDetails = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const { firstName, lastName, email, homebase, airline, role } = req.body

  try {
    const user = await User.findById(id)

    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    user.firstName = firstName
    user.lastName = lastName
    user.email = email
    user.homebase = homebase
    user.airline = airline
    user.role = role

    await user.save()

    res.status(200).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      homebase: user.homebase,
      airline: user.airline,
      role: user.role
    })
  } catch (error) {
    console.error('Error updating user details:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// Update user password
export const updateUserPassword = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const { password } = req.body

  try {
    const user = await User.findById(id)
    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    if (password) {
      user.password = password
      await user.save()
      res.json({ message: 'Password updated successfully' })
    } else {
      res.status(400).json({ message: 'Password is required' })
    }
  } catch (error) {
    console.error('Error updating password:', error)
    res.status(500).json({ message: 'Failed to update password' })
  }
}

export const friendRequest = async (req: Request, res: Response): Promise<void> => {
  const { senderId, recipientId } = req.body

  if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(recipientId)) {
    res.status(400).json({ message: 'Invalid senderId or recipientId' })
    return
  }

  try {
    const sender = await User.findById(senderId)
    const recipient = await User.findById(recipientId)

    if (!sender || !recipient) {
      res.status(404).json({ message: 'Sender or recipient not found' })
      return
    }

    if (recipient.friendRequests.includes(senderId) || sender.sentFriendRequests.includes(recipientId)) {
      res.status(400).json({ message: 'Friend request already sent' })
      return
    }

    recipient.friendRequests.push(senderId)
    sender.sentFriendRequests.push(recipientId)

    await recipient.save()
    await sender.save()

    res.status(200).json({ message: 'Friend request sent successfully' })
  } catch (error) {
    console.error('Error sending friend request:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const friendList = async (req: Request, res: Response) => {
  const userId = req.params.id

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: 'Invalid User ID' })
    return
  }

  try {
    const user = await User.findById(userId).populate({
      path: 'friends',
      select: 'firstName lastName email homebase airline role profilePicture',
      populate: [
        { path: 'homebase', select: 'IATA ICAO city' },
        { path: 'airline', select: 'ICAO Name' },
        { path: 'role', select: 'value' }
      ]
    })

    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    res.status(200).json(user.friends)
  } catch (error) {
    console.error('Error fetching friends list:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const addFriend = async (req: Request, res: Response) => {
  const userId = req.params.id

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: 'Invalid User ID' })
    return
  }

  try {
    const user = await User.findById(userId).populate({
      path: 'friendRequests',
      select: 'firstName lastName email homebase airline role profilePicture',
      populate: [
        { path: 'homebase', select: 'IATA ICAO city' },
        { path: 'airline', select: 'ICAO Name' },
        { path: 'role', select: 'value' }
      ]
    })

    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    res.status(200).json(user.friendRequests)
  } catch (error) {
    console.error('Error fetching friends list:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const acceptRequest = async (req: Request, res: Response): Promise<void> => {
  console.log('Request payload:', req.body)
  const { senderId, recipientId } = req.body

  try {
    const sender = await User.findById(senderId)
    const recipient = await User.findById(recipientId)

    if (!sender || !recipient) {
      res.status(404).json({ message: 'Sender or recipient not found' })
      return
    }

    sender.friends.push(recipientId)
    recipient.friends.push(senderId)

    recipient.friendRequests = recipient.friendRequests.filter(request => request.toString() !== senderId.toString())

    sender.sentFriendRequests = sender.sentFriendRequests.filter(
      request => request.toString() !== recipientId.toString()
    )

    await sender.save()
    await recipient.save()

    res.status(200).json({ message: 'Friend request accepted successfully' })
  } catch (error) {
    console.error('Error accepting friend request:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const removeFriend = async (req: Request, res: Response): Promise<void> => {
  console.log('Request payload:', req.body)
  const { userId, friendId } = req.body

  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(friendId)) {
    res.status(400).json({ message: 'Invalid userId or friendId' })
    return
  }

  try {
    const user = await User.findById(userId)
    const friend = await User.findById(friendId)

    if (!user || !friend) {
      res.status(404).json({ message: 'User or friend not found' })
      return
    }

    user.friends = user.friends.filter(id => id.toString() !== friendId.toString())
    friend.friends = friend.friends.filter(id => id.toString() !== userId.toString())

    await user.save()
    await friend.save()

    res.status(200).json({ message: 'Friend removed successfully' })
  } catch (error) {
    console.error('Error removing friend:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const declineRequest = async (req: Request, res: Response): Promise<void> => {
  const { senderId, recipientId } = req.body

  if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(recipientId)) {
    res.status(400).json({ message: 'Invalid senderId or recipientId' })
    return
  }

  try {
    const sender = await User.findById(senderId)
    const recipient = await User.findById(recipientId)

    if (!sender || !recipient) {
      res.status(404).json({ message: 'Sender or recipient not found' })
      return
    }

    sender.sentFriendRequests = sender.sentFriendRequests.filter(id => id.toString() !== recipientId.toString())

    recipient.friendRequests = recipient.friendRequests.filter(id => id.toString() !== senderId.toString())

    await sender.save()
    await recipient.save()

    res.status(200).json({ message: 'Friend request declined successfully' })
  } catch (error) {
    console.error('Error declining friend request:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const getNonFriends = async (req: Request, res: Response): Promise<void> => {
  const userId = req.params.id

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: 'Invalid userId' })
    return
  }

  try {
    const currentUser = await User.findById(userId).select('friends sentFriendRequests friendRequests')

    if (!currentUser) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    // Exclude friends, friend requests and the logged-in user
    const nonFriends = await User.find({
      _id: { $nin: [userId, ...currentUser.friends, ...currentUser.friendRequests] }
    })
      .select('firstName lastName role email homebase airline profilePicture')
      .populate({
        path: 'role',
        select: 'value'
      })

    res.status(200).json({
      nonFriends,
      sentFriendRequests: currentUser.sentFriendRequests // Include the sent friend requests
    })
  } catch (error) {
    console.error('Error fetching non-friends:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

// For Admin Dashboard
export const getUsers = async (req: Request, res: Response) => {
  const { page = 1, limit = 5, search = '' } = req.query

  try {
    const query = {
      $or: [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { 'role.value': { $regex: search, $options: 'i' } },
        { 'homebase.name': { $regex: search, $options: 'i' } },
        { 'airline.Name': { $regex: search, $options: 'i' } }
      ]
    }

    const users = await User.find(query)
      .populate('homebase', 'name')
      .populate('airline', 'Name')
      .populate('role', 'value')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))

    const count = await User.countDocuments(query)

    res.status(200).json({ users, totalPages: Math.ceil(count / Number(limit)), currentPage: Number(page) })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params

  try {
    // Find and delete the user
    const deletedUser = await User.findByIdAndDelete(id)
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' })
    }

    await Roster.deleteMany({ userId: id })
    await DiningRecommendation.deleteMany({ user: id })
    await Checklist.deleteMany({ userId: id })
    await Bookmark.deleteMany({ userId: id })
    await Message.deleteMany({
      $or: [{ sender: id }, { recipient: id }]
    })
    await User.updateMany({ friends: id }, { $pull: { friends: id } })

    await User.updateMany({ friendRequests: id }, { $pull: { friendRequests: id } })

    await User.updateMany({ sentFriendRequests: id }, { $pull: { sentFriendRequests: id } })

    res.status(200).json({ message: 'User and all related records deleted successfully, and references removed' })
  } catch (error) {
    console.error('Error deleting user and related data:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const createUser = async (req: Request, res: Response) => {
  const { firstName, lastName, email, password, homebase, airline, role } = req.body

  try {
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

// Update an existing user by ID
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params
  const { firstName, lastName, email, homebase, airline, role } = req.body

  try {
    const user = await User.findById(id)

    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }

    user.firstName = firstName
    user.lastName = lastName
    user.email = email
    user.homebase = homebase
    user.airline = airline
    user.role = role

    await user.save()

    res.status(200).json({
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

export const getMessages = async (req: Request, res: Response) => {
  const { userId, recipientId } = req.params

  try {
    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: recipientId },
        { sender: recipientId, recipient: userId }
      ]
    }).sort({ timestamp: -1 })

    res.status(200).json(messages)
  } catch (error) {
    console.error('Error fetching messages:', error)
    res.status(500).json({ message: 'Error fetching messages' })
  }
}

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 6 * 1024 * 1024
  }
})

export const uploadProfilePicture = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' })
      return // Explicitly return to prevent further execution
    }

    const { userId } = req.params
    if (!userId) {
      res.status(400).json({ message: 'User ID is required' })
      return // Explicitly return to prevent further execution
    }

    const user = await User.findById(userId)
    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return // Explicitly return to prevent further execution
    }

    // Delete the existing profile picture if it exists and is not the default
    if (user.profilePicture && user.profilePicture !== DEFAULT_PROFILE_PICTURE_URL) {
      const filePath = user.profilePicture.split(`https://storage.googleapis.com/${bucket.name}/`)[1]
      if (filePath) {
        try {
          await bucket.file(filePath).delete()
          console.log('Existing profile picture deleted:', filePath)
        } catch (error) {
          console.error('Error deleting existing profile picture:', error)
        }
      }
    }

    // Generate a unique filename for the new profile picture
    const uniqueFilename = `profile-pictures/${uuidv4()}-${req.file.originalname}`
    const blob = bucket.file(uniqueFilename)
    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: req.file.mimetype
    })

    blobStream.on('error', (error: Error) => {
      console.error('Error uploading to GCS:', error)
      res.status(500).json({ message: 'Error uploading profile picture' })
    })

    blobStream.on('finish', async () => {
      try {
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`

        // Update the user's profile picture URL in the database
        await User.findByIdAndUpdate(userId, { profilePicture: publicUrl })

        res.status(200).json({ message: 'Profile picture uploaded successfully', url: publicUrl })
      } catch (error) {
        console.error('Error updating database:', error)
        res.status(500).json({ message: 'Error updating profile picture in database' })
      }
    })

    blobStream.end(req.file.buffer) // End the stream and upload the file
  } catch (error) {
    console.error('Error handling profile picture upload:', error)
    res.status(500).json({ message: 'Error uploading profile picture' })
  }
}
