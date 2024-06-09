import mongoose from 'mongoose'

const airportSchema = new mongoose.Schema(
  {
    name: String,
    city: String,
    country: String,
    IATA: String,
    ICAO: String,
    latitude: Number,
    longitude: Number,
    altitude: Number,
    timezone: String,
    DST: String,
    tz_database: String,
    type: String,
    source: String,
    city_latitude: Number,
    city_longitude: Number
  },
  { timestamps: true }
)

// Virtual for mapping `_id` to `id`
airportSchema.virtual('id').get(function () {
  return this._id.toHexString()
})

airportSchema.set('toJSON', {
  virtuals: true
})

const Airport = mongoose.model('Airport', airportSchema)

export default Airport
