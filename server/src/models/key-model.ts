import mongoose, { Schema, Document } from 'mongoose'

export interface IKey extends Document {
  userId: mongoose.Schema.Types.ObjectId
  publicKey: string
  secretKey: string  
  createdAt: Date
}

const keySchema: Schema<IKey> = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  publicKey: { type: String, required: true },
  secretKey: { type: String, required: true},
  createdAt: { type: Date, default: Date.now }
})

const Key = mongoose.model<IKey>('Key', keySchema)
export default Key