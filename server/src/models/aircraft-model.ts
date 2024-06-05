const mongoose = require('mongoose')

// Define the schema
const AircraftSchema = new mongoose.Schema({
  objectId: {
    type: String,
    required: true
  },
  WingType: {
    type: String,
    required: true
  },
  Model: {
    type: String,
    required: true
  },
  ACL: {
    type: mongoose.Schema.Types.Mixed, // Use Mixed type if ACL can be of any type
    default: null
  },
  updatedAt: {
    type: Date,
    required: true
  },
  Manufacturer: {
    type: String,
    required: true
  },
  IATACode: {
    type: String,
    required: true
  },
  ICAOCode: {
    type: String,
    required: true
  },
  Aircraft_Manufacturer: {
    type: String,
    required: true
  },
  Type: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    required: true
  }
})

// Create the model
const Aircraft = mongoose.model('Aircraft', AircraftSchema)

// Export the model
export default Aircraft
