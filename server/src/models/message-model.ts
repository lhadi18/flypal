import mongoose, { Schema, Document } from 'mongoose'

export interface IMessage extends Document {
  sender: mongoose.Schema.Types.ObjectId
  recipient: mongoose.Schema.Types.ObjectId
  encryptedContent: string  // Changed from content to encryptedContent
  nonce: string            // Added for encryption
  timestamp: Date
  read: boolean
}

const messageSchema: Schema<IMessage> = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  encryptedContent: { type: String, required: true },
  nonce: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
})

const Message = mongoose.model<IMessage>('Message', messageSchema)
export default Message
