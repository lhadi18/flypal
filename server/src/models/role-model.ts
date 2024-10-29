import mongoose, { Document, Schema } from 'mongoose'

export interface IRole extends Document {
  label: string
  value: string
}

const RoleSchema: Schema = new Schema(
  {
    label: { type: String, required: true },
    value: { type: String, required: true }
  },
  {
    timestamps: true
  }
)

const Role = mongoose.model<IRole>('Role', RoleSchema)

export default Role
