import Message from '../models/message-model'
import { Request, Response } from 'express'
import { bucket } from '../services/gcs'
import User from '../models/user-model'
import { v4 as uuidv4 } from 'uuid'
import mongoose from 'mongoose'
import multer from 'multer'

const DEFAULT_PROFILE_PICTURE_URL = 'https://storage.googleapis.com/flypal/profile-pictures/default-profile-picture.jpg'

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

export const getUserDetails = async (req: Request, res: Response) => {
  const { userId } = req.query
  console.log('Received userId:', userId)

  if (typeof userId !== 'string' || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid User ID' })
  }

  try {
    const user = await User.findById(userId)
      .populate('homebase', 'IATA ICAO city')
      .populate('airline', 'ICAO Name')
      .populate('role', 'value')
      .select('-password')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    res.status(200).json(user)
  } catch (error) {
    console.error('Error fetching user details:', error)
    res.status(500).json({ message: 'Server error' })
  }
}

export const updateUserDetails = async (req: Request, res: Response) => {
  const { id } = req.params
  const { firstName, lastName, email, homebase, airline, role } = req.body
  console.log(id)

  try {
    const user = await User.findById(id)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
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
export const updateUserPassword = async (req: Request, res: Response) => {
  const { id } = req.params
  const { password } = req.body

  try {
    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }
    if (password) {
      user.password = password
      const updatedPassword = await user.save()
      res.json(updatedPassword)
    } else {
      res.json(user)
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Failed to update password' })
  }
}

export const getAllUsers = async (req: Request, res: Response) => {
  const { userId } = req.params
  console.log(req.params)

  try {
    const users = await User.find({ _id: { $ne: userId } })
      .populate('homebase')
      .populate('airline')
      .populate('friendRequests')
      .populate('friends')
      .populate('sentFriendRequests')
      .populate('role', 'value')

    res.status(200).json(users)
  } catch (err) {
    console.error('Error retrieving users:', err)
    res.status(500).json({ message: 'Error retrieving users' })
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
    await User.findByIdAndDelete(id)
    res.status(200).json({ message: 'User deleted successfully' })
  } catch (error) {
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
export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params
  const { firstName, lastName, email, homebase, airline, role } = req.body

  try {
    const user = await User.findById(id)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
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

// Send a new message
export const sendMessage = async (req: Request, res: Response) => {
  const { sender, recipient, content } = req.body

  try {
    const newMessage = new Message({ sender, recipient, content })
    await newMessage.save()

    res.status(201).json(newMessage)
  } catch (error) {
    console.error('Error sending message:', error)
    res.status(500).json({ message: 'Error sending message' })
  }
}

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 6 * 1024 * 1024
  }
})

export const uploadProfilePicture = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const { userId } = req.params
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

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

    const uniqueFilename = `profile-pictures/${uuidv4()}-${req.file.originalname}`
    const blob = bucket.file(uniqueFilename)
    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: req.file.mimetype
    })

    blobStream.on('error', error => {
      console.error('Error uploading to GCS:', error)
      res.status(500).json({ message: 'Error uploading profile picture' })
    })

    blobStream.on('finish', async () => {
      try {
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`

        await User.findByIdAndUpdate(userId, { profilePicture: publicUrl })

        res.status(200).json({ message: 'Profile picture uploaded successfully', url: publicUrl })
      } catch (error) {
        console.error('Error updating database:', error)
        res.status(500).json({ message: 'Error updating profile picture in database' })
      }
    })

    blobStream.end(req.file.buffer)
  } catch (error) {
    console.error('Error handling profile picture upload:', error)
    res.status(500).json({ message: 'Error uploading profile picture' })
  }
}
