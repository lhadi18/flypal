import mongoose, { Schema, Document } from 'mongoose'

export interface PushToken extends Document {
  userId: mongoose.Schema.Types.ObjectId
  token: string
  deviceId: string
  createdAt: Date
  updatedAt: Date
}

const pushTokenSchema: Schema = new Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true },
    deviceId: { type: String, required: true }
  },
  {
    timestamps: true
  }
)

const PushToken = mongoose.model<PushToken>('PushToken', pushTokenSchema)

export default PushToken
