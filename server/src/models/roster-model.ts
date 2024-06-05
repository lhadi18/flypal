import Aircraft from './aircraft-model'
import Airport from './airport-model'
import mongoose from 'mongoose'

const rosterSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User' // Assuming you have a User model
    },
    type: String,
    origin: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: 'Airport'
    },
    destination: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: 'Airport'
    },
    departureTime: Date,
    arrivalTime: Date,
    flightNumber: String,
    aircraftType: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      ref: 'Aircraft'
    },
    notes: String
  },
  { timestamps: true }
)

const Roster = mongoose.model('Roster', rosterSchema)
export default Roster
