import mongoose from 'mongoose'

const bookmarkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    diningId: {
      type: String, // This can hold either a generated ID or an ObjectId as a string
      required: true
    },
    sourceType: {
      type: String,
      required: true,
      enum: ['API', 'UserPost']
    },
    bookmarkDate: {
      type: Date,
      default: Date.now
    },
    name: {
      type: String,
      required: true
    },
    location: {
      type: String,
      required: true
    },
    imageUrl: {
      type: String
    },
    rating: {
      type: Number
    },
    totalReviews: {
      type: Number
    }
  },
  {
    timestamps: true
  }
)

const Bookmark = mongoose.model('Bookmark', bookmarkSchema)

export default Bookmark
