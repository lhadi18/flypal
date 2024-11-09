import { Document, Schema, Types, CallbackError } from 'mongoose'
import mongoose from 'mongoose'
import bcrypt from 'bcrypt'

export interface User extends Document {
  firstName: string
  lastName: string
  email: string
  password: string
  homebase: mongoose.Schema.Types.ObjectId
  airline: mongoose.Schema.Types.ObjectId
  role: Types.ObjectId // Update to use ObjectId for Role reference
  friendRequests: mongoose.Schema.Types.ObjectId[]
  friends: mongoose.Schema.Types.ObjectId[]
  sentFriendRequests: mongoose.Schema.Types.ObjectId[]
  matchPassword(enteredPassword: string): Promise<boolean>
}

const userSchema: Schema<User> = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  homebase: { type: mongoose.Schema.Types.ObjectId, ref: 'Airport', required: true },
  airline: { type: mongoose.Schema.Types.ObjectId, ref: 'Airline', required: true },
  role: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true }, // Reference to Role model
  friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  sentFriendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
})

userSchema.pre<User>('save', async function (next) {
  if (!this.isModified('password')) {
    return next()
  }

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error as CallbackError)
  }
})

userSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password)
}

const User = mongoose.model<User>('User', userSchema)

export default User
