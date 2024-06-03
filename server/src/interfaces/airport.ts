import { Document } from 'mongoose'

interface AirportDoc extends Document {
  id: string
  ident: string
  type: string
  name: string
  latitude_deg: string
  longitude_deg: string
  elevation_ft: string
  continent: string
  iso_country: string
  iso_region: string
  municipality: string
  scheduled_service: string
  gps_code: string
  iata_code: string
  local_code: string
  home_link?: string
  wikipedia_link?: string
  keywords?: string
}

interface FormattedAirport {
  id: string
  ident: string
  type: string
  name: string
  latitude_deg: string
  longitude_deg: string
  elevation_ft: string
  continent: string
  iso_country: string
  iso_region: string
  municipality: string
  scheduled_service: string
  gps_code: string
  iata_code: string
  local_code: string
  home_link?: string
  wikipedia_link?: string
  keywords?: string
  display: string // Additional field for formatted display
}
