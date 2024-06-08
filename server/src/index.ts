import diningRoutes from './routes/dining-recommendation-routes'
import aircraftRoutes from './routes/aircraft-routes'
import airportRoutes from './routes/airport-routes'
import airlineRoutes from './routes/airline-routes'
import rosterRoutes from './routes/roster-routes'
import placesRoutes from './routes/places-routes'
import eventRoutes from './routes/event-routes'
import userRoutes from './routes/user-routes'
import pdfRoutes from './routes/pdf-routes'
import connectDB from './config'
import express from 'express'
import dotenv from 'dotenv'
import http from 'http'
import cors from 'cors'

dotenv.config()
connectDB()

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/users', userRoutes)
app.use('/api/aircraft', aircraftRoutes)
app.use('/api/airport', airportRoutes)
app.use('/api/roster', rosterRoutes)
app.use('/api/events', eventRoutes)
app.use('/api/places', placesRoutes)
app.use('/api/dining', diningRoutes)
app.use('/api/airline', airlineRoutes)
app.use('/api/pdf', pdfRoutes)

const PORT = process.env.PORT || 9000

const httpServer = http.createServer(app)

httpServer.listen(PORT, () => {
  console.log(`HTTP Server running on port ${PORT}`)
})
