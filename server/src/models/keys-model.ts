import mongoose, { Schema, Document } from 'mongoose'

const KeySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    unique: true
  },
  publicKey: {
    type: String,
    required: true,
  },
});

const Key = mongoose.model('Key', KeySchema);

export default Key
