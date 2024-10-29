import mongoose from 'mongoose'

const bookmarkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    },
    diningId: {
      type: String // For dining bookmarks
    },
    eventId: {
      type: String // For event bookmarks
    },
    airportId: {
      type: mongoose.Schema.Types.ObjectId, // Reference to Airport model
      required: true,
      ref: 'Airport'
    },
    sourceType: {
      type: String,
      required: true,
      enum: ['DINING_API', 'DINING_USER_POST', 'EVENT_API']
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
    },
    externalAddress: {
      type: String
    },
    eventLocationMap: {
      type: String
    },
    eventTime: {
      type: String
    },
    eventDescription: {
      type: String
    }
  },
  {
    timestamps: true
  }
)

const Bookmark = mongoose.model('Bookmark', bookmarkSchema)

export default Bookmark
