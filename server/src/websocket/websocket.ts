import Message from '../models/message-model'
import { WebSocketServer } from 'ws'

type ClientsMap = Map<string, any> // Map of connected clients
const onlineUsers = new Set<string>() // Set to track online users
const readCache: Map<string, Set<string>> = new Map()

export function setupWebSocketServer(server: any) {
  const wss = new WebSocketServer({ server })
  const clients: ClientsMap = new Map()

  wss.on('connection', ws => {
    console.log('New client connected')

    ws.on('message', async data => {
      try {
        const rawData = data.toString()
        console.log('Raw data received:', rawData)
        const parsedData = JSON.parse(rawData)
        console.log('Parsed data:', parsedData)

        // Handle registration of new clients
        if (parsedData.type === 'register') {
          const { userId } = parsedData
          if (!userId) {
            console.error('User ID is missing in register message:', parsedData)
            return
          }

          clients.set(userId, ws)
          onlineUsers.add(userId) // Add user to online users
          console.log(`User registered: ${userId}`)

          // Notify all clients, including the newly connected one, of online users
          const onlineUsersList = Array.from(onlineUsers).map(id => ({
            userId: id,
            status: 'online'
          }))

          // Send the online users list to the new client
          ws.send(JSON.stringify({ type: 'online_users', users: onlineUsersList }))

          // Notify other clients about this user's online status
          broadcastStatusChange(clients, userId, 'online')
          return
        }

        // Handle disconnect messages (if manually sent)
        if (parsedData.type === 'disconnect') {
          const { userId } = parsedData
          if (userId && clients.has(userId)) {
            clients.delete(userId)
            onlineUsers.delete(userId)
            console.log(`User disconnected via message: ${userId}`)
            broadcastStatusChange(clients, userId, 'offline')
          }
          return
        }

        // Handle chat messages
        const { sender, recipient, content } = parsedData
        if (parsedData.type === 'chat_message') {
          if (!sender || !recipient || !content) {
            console.error('Missing fields in chat message:', parsedData)
            return
          }

          // Save the message to the database
          const message = await Message.create({ sender, recipient, content })
          console.log('Message saved:', message)

          // Prepare the message for sending
          const chatMessage = {
            type: 'chat_message',
            _id: message._id,
            sender: message.sender,
            recipient: message.recipient,
            content: message.content,
            timestamp: message.timestamp
          }

          // Send the message to both sender and recipient if connected
          ;[sender, recipient].forEach(userId => {
            if (clients.has(userId)) {
              clients.get(userId).send(JSON.stringify(chatMessage))
            }
          })
          return
        }

        if (parsedData.type === 'read_receipt') {
          const { senderId, recipientId, messageIds } = parsedData
          const cacheKey = `${senderId}_${recipientId}`

          if (!readCache.has(cacheKey)) {
            readCache.set(cacheKey, new Set())
          }

          const cachedIds = readCache.get(cacheKey)!
          messageIds.forEach((id: string) => cachedIds.add(id))

          const readReceiptMessage = {
            type: 'read_receipt',
            senderId,
            recipientId,
            messageIds
          }

          ;[senderId, recipientId].forEach(userId => {
            if (clients.has(userId)) {
              clients.get(userId).send(JSON.stringify(readReceiptMessage))
            }
          })

          setTimeout(async () => {
            const idsToUpdate = Array.from(cachedIds)
            await Message.updateMany(
              { _id: { $in: idsToUpdate }, sender: recipientId, recipient: senderId, read: false },
              { $set: { read: true } }
            )
            readCache.delete(cacheKey)
          }, 5000)
          return
        }

        console.error('Unknown message type received:', parsedData.type)
      } catch (error) {
        console.error('Error handling message:', error)
      }
    })

    ws.on('close', () => {
      console.log('Client disconnected')
      let disconnectedUserId

      clients.forEach((clientWs, userId) => {
        if (clientWs === ws) {
          disconnectedUserId = userId
          clients.delete(userId)
          onlineUsers.delete(userId)
        }
      })

      if (disconnectedUserId) {
        broadcastStatusChange(clients, disconnectedUserId, 'offline')
        console.log(`User disconnected: ${disconnectedUserId}`)
      }
    })
  })

  console.log('WebSocket server setup complete')

  // Cleanup function for graceful shutdown
  function cleanup(callback: () => void) {
    console.log('Cleaning up WebSocket server...')
    wss.clients.forEach(client => {
      client.close() // Close each client
    })
    wss.close(callback) // Close the WebSocket server
  }

  return { wss, cleanup }
}

// Broadcast a user's status change to all connected clients
function broadcastStatusChange(clients: ClientsMap, userId: string, status: string): void {
  const statusMessage = {
    type: 'status_change',
    userId,
    status
  }
  clients.forEach(clientWs => {
    try {
      clientWs.send(JSON.stringify(statusMessage))
    } catch (error) {
      console.error('Error broadcasting status change:', error)
    }
  })
}
