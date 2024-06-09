import mongoose from 'mongoose'

const diningRecommendationSchema = new mongoose.Schema(
  {
    restaurantName: { type: String, required: true },
    location: { type: String, required: true },
    review: { type: String, required: true },
    rating: { type: Number, required: true },
    tags: [String],
    imageUrl: String,
    airport: { type: mongoose.Schema.Types.ObjectId, ref: 'Airport', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    likes: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
)

const DiningRecommendation = mongoose.model('DiningRecommendation', diningRecommendationSchema)

export default DiningRecommendation
