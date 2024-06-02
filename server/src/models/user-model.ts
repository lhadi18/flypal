import mongoose, { CallbackError, Schema } from 'mongoose'
import { User } from '../interfaces/user'
import bcrypt from 'bcrypt'

const userSchema: Schema<User> = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
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
