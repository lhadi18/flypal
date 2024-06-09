import mongoose, { Schema, Document } from 'mongoose'

export interface IAirline extends Document {
  Name: string
  IATA: string
  ICAO: string
  Callsign: string
  Country: string
  Active: string
}

const AirlineSchema: Schema = new Schema({
  Name: { type: String, required: true },
  IATA: { type: String, required: true },
  ICAO: { type: String, required: true },
  Callsign: { type: String, required: true },
  Country: { type: String, required: true },
  Active: { type: String, required: true }
})
const Airline = mongoose.model<IAirline>('Airline', AirlineSchema)

export default Airline
