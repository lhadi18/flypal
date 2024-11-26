import Message from '../models/message-model'
import { WebSocketServer } from 'ws'

type ClientsMap = Map<string, any> // Map of connected clients

// Function to set up WebSocket server
export function setupWebSocketServer(server: any): void {
  const wss = new WebSocketServer({ server })
  const clients: ClientsMap = new Map()

  wss.on('connection', ws => {
    console.log('New client connected')

    // Handle incoming messages
    ws.on('message', async data => {
      try {
        const rawData = data.toString()
        console.log('Raw data received:', data.toString())
        const parsedData = JSON.parse(rawData)
        console.log('Parsed data:', parsedData)

        if (parsedData.type === 'register') {
          const { userId } = parsedData
          clients.set(userId, ws)
          console.log(`User registered: ${userId}`)
          return
        }

        const { sender, recipient, content } = parsedData
        if (!sender || !recipient || !content) {
          console.error('Missing fields in message:', parsedData)
          return
        }

        const message = await Message.create({ sender, recipient, content })
        console.log('Message saved:', message)
        ;[sender, recipient].forEach(userId => {
          if (clients.has(userId)) {
            clients.get(userId).send(JSON.stringify(message))
          }
        })
      } catch (error) {
        console.error('Error handling message:', error)
      }
    })

    // Handle client registration
    ws.on('register', userId => {
      console.log(`Register event for userId: ${userId}`)
      clients.set(userId, ws)
    })

    // Handle client disconnection
    ws.on('close', () => {
      console.log('Client disconnected')
      clients.forEach((clientWs, userId) => {
        if (clientWs === ws) {
          clients.delete(userId)
        }
      })
    })
  })

  console.log('WebSocket server setup complete')
}
