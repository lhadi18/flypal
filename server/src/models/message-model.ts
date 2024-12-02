import mongoose, { Schema, Document } from 'mongoose'

export interface IMessage extends Document {
  sender: mongoose.Schema.Types.ObjectId
  recipient: mongoose.Schema.Types.ObjectId
  content: string
  timestamp: Date
  nonce: string
  read: boolean
}

const messageSchema: Schema<IMessage> = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  nonce: { type: String, required: true },
  read: { type: Boolean, default: false }
})

const Message = mongoose.model<IMessage>('Message', messageSchema)

export default Message
