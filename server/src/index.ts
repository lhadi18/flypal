import diningRoutes from './routes/dining-recommendation-routes'
import checklistRoutes from './routes/checklist-routes'
import aircraftRoutes from './routes/aircraft-routes'
import bookmarkRoutes from './routes/bookmark-routes'
import airportRoutes from './routes/airport-routes'
import airlineRoutes from './routes/airline-routes'
import messageRoutes from './routes/message-routes'
import rosterRoutes from './routes/roster-routes'
import placesRoutes from './routes/places-routes'
import eventRoutes from './routes/event-routes'
import userRoutes from './routes/user-routes'
import roleRoutes from './routes/role-routes'
import pdfRoutes from './routes/pdf-routes'
import keyRoutes from './routes/key-routes'
import connectDB from './config'
import express from 'express'
import dotenv from 'dotenv'
import http from 'http'
import cors from 'cors'

import { setupWebSocketServer } from './websocket/websocket'

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
app.use('/api/checklist', checklistRoutes)
app.use('/api/bookmarks', bookmarkRoutes)
app.use('/api/roles', roleRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/key', keyRoutes)

const PORT = process.env.PORT || 8080

const httpServer = http.createServer(app)

// Set up WebSocket server
const { wss, cleanup } = setupWebSocketServer(httpServer)

httpServer.listen(PORT, () => {
  console.log(`HTTP Server running on port ${PORT}`)
})

// Graceful shutdown
function shutdown() {
  console.log('Shutting down server...')

  httpServer.close(() => {
    console.log('HTTP server closed')
  })

  cleanup(() => {
    console.log('WebSocket server cleaned up')
    process.exit(0) // Exit the process after cleanup
  })

  setTimeout(() => {
    console.error('Forced shutdown')
    process.exit(1)
  }, 5000)
}

process.on('SIGINT', shutdown) // Catch Ctrl+C
process.on('SIGTERM', shutdown) // Catch termination signal
