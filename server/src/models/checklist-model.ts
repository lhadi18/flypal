import mongoose from 'mongoose';

const checklistSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  title: {
    type: String,
    required: true
  },
  flightRoute: {
    type: String,
    required: false
  },
  travelDate: {
    type: Date,
    required: false
  },
  items: {
    type: [String],
    required: false
  }
}, {
  timestamps: true
});

const Checklist = mongoose.model('Checklist', checklistSchema);

export default Checklist;
