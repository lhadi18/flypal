import PushToken from '../models/push-token-model'
import Message from '../models/message-model'
import User from '../models/user-model'
import { WebSocketServer } from 'ws'
import mongoose from 'mongoose'

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

        if (parsedData.type === 'friend_request') {
          const { senderId, recipientId } = parsedData
          if (clients.has(recipientId)) {
            clients.get(recipientId).send(
              JSON.stringify({
                type: 'friend_request',
                senderId,
                message: 'You have a new friend request.'
              })
            )
          } else {
            console.log(`User ${recipientId} is offline. Sending push notification.`)
            await sendPushNotification(recipientId, 'Friend Request', 'You have a new friend request.')
          }
          return
        }

        if (parsedData.type === 'friend_added') {
          console.log('nigga')
          const { userId, friendId } = parsedData
          // Broadcast the update to both users
          ;[userId, friendId].forEach(id => {
            if (clients.has(id)) {
              clients.get(id).send(
                JSON.stringify({
                  type: 'friend_added',
                  userId: id === userId ? friendId : userId,
                  message: 'You are now friends.'
                })
              )
            }
          })
          ;[userId, friendId].forEach(id => {
            if (clients.has(id)) {
              clients.get(id).send(
                JSON.stringify({
                  type: 'friend_added_connection',
                  userId: id === userId ? friendId : userId,
                  message: 'You are now friends.'
                })
              )
            }
          })
          return
        }

        if (parsedData.type === 'friend_removed') {
          const { userId, friendId } = parsedData

          // Notify both users about the removal
          ;[userId, friendId].forEach(id => {
            if (clients.has(id)) {
              clients.get(id).send(
                JSON.stringify({
                  type: 'friend_removed',
                  otherUserId: id === userId ? friendId : userId,
                  message: 'Friend has been removed.'
                })
              )
            }
          })
          ;[userId, friendId].forEach(id => {
            if (clients.has(id)) {
              clients.get(id).send(
                JSON.stringify({
                  type: 'friend_removed_connection',
                  otherUserId: id === userId ? friendId : userId,
                  message: 'Friend has been removed.'
                })
              )
            }
          })
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
        if (parsedData.type === 'chat_message') {
          const { sender, recipient, encryptedContent, nonce, plainText, isRosterShare } = parsedData

          if (!sender || !recipient || !encryptedContent || !nonce || !plainText) {
            console.error('Missing fields in chat message:', parsedData)
            return
          }

          const message = await Message.create({ sender, recipient, encryptedContent, nonce })
          console.log('Message saved:', message)

          const chatMessage = {
            type: 'chat_message',
            _id: message._id,
            sender: message.sender,
            recipient: message.recipient,
            nonce: message.nonce,
            encryptedContent: message.encryptedContent,
            plainText,
            timestamp: message.timestamp
          }

          const senderInfo = await User.findById(sender).select('firstName lastName')
          const senderName = senderInfo ? `${senderInfo.firstName} ${senderInfo.lastName}` : 'Unknown Sender'

          // Use the plain text message for notifications
          const notificationBody = plainText.length > 50 ? `${plainText.slice(0, 50)}...` : plainText

          // Send the message to the recipient if connected
          await sendPushNotification(recipient, 'New Message', notificationBody, senderName)

          if (clients.has(recipient)) {
            clients.get(recipient).send(JSON.stringify(chatMessage))
            console.log(`Message forwarded to user ${recipient}`)
          } else {
            if (!isRosterShare) {
              console.log(`User ${recipient} is offline. Sending push notification.`)
            }
          }

          if (clients.has(sender)) {
            clients.get(sender).send(JSON.stringify(chatMessage))
          }

          return
        }

        if (parsedData.type === 'roster_shared') {
          const { senderId, recipientId, message } = parsedData

          if (!senderId || !recipientId || !message) {
            console.error('Missing fields in roster_shared notification:', parsedData)
            return
          }

          const senderInfo = await User.findById(senderId).select('firstName lastName')
          const senderName = senderInfo ? `${senderInfo.firstName} ${senderInfo.lastName}` : 'Unknown User'

          const notificationMessage = {
            type: 'roster_shared',
            senderId,
            recipientId,
            message,
            senderName
          }

          await sendPushNotification(
            recipientId,
            'Roster Shared',
            `${senderName} has shared their monthly roster with you.`,
            senderName
          )

          if (clients.has(recipientId)) {
            clients.get(recipientId).send(JSON.stringify(notificationMessage))
            console.log(`Roster shared notification sent to ${recipientId}`)
          } else {
            console.log(`User ${recipientId} is offline. Sending push notification.`)
          }
          return
        }

        if (parsedData.type === 'read_receipt') {
          const { senderId, recipientId, messageIds } = parsedData

          if (!clients.has(recipientId)) {
            console.warn(`Recipient (${recipientId}) is offline. Not broadcasting read receipt.`)
            return
          }

          const cacheKey = `${senderId}_${recipientId}`
          if (!readCache.has(cacheKey)) {
            readCache.set(cacheKey, new Set<string>())
          }

          const cachedIds = readCache.get(cacheKey)
          if (cachedIds) {
            messageIds.forEach((id: string) => cachedIds.add(id))
          }

          const readReceiptMessage = {
            type: 'read_receipt',
            senderId,
            recipientId,
            messageIds
          }

          ;[senderId, recipientId].forEach(userId => {
            if (clients.has(userId)) {
              console.log(`Broadcasting to userId: ${userId}`)
              clients.get(userId)?.send(JSON.stringify(readReceiptMessage))
            }
          })

          setTimeout(async () => {
            if (cachedIds) {
              const idsToUpdate = Array.from(cachedIds).filter(id => {
                try {
                  new mongoose.Types.ObjectId(id)
                  return true
                } catch {
                  console.warn(`Invalid ObjectId detected and excluded: ${id}`)
                  return false
                }
              })

              if (idsToUpdate.length > 0) {
                try {
                  await Message.updateMany(
                    { _id: { $in: idsToUpdate }, sender: recipientId, recipient: senderId, read: false },
                    { $set: { read: true } }
                  )
                } catch (error) {
                  console.error('Error updating read receipts:', error)
                }
              } else {
                console.warn('No valid ObjectIds to update in the database.')
              }

              readCache.delete(cacheKey)
            }
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

    const shutdownMessage = JSON.stringify({ type: 'server_shutdown', message: 'Server is shutting down' })
    clients.forEach(clientWs => {
      try {
        clientWs.send(shutdownMessage)
        clientWs.close()
      } catch (error) {
        console.error('Error sending shutdown message:', error)
      }
    })

    clients.clear()
    onlineUsers.clear()

    wss.close(callback)
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

// Send a push notification to a user
async function sendPushNotification(userId: string, title: string, body: string, senderName?: string) {
  try {
    const tokens = await PushToken.find({ userId })

    if (tokens.length === 0) {
      console.warn(`No push tokens found for user: ${userId}`)
      return
    }

    const notificationTitle = senderName ? `Message from ${senderName}` : title
    const notificationBody = body

    const messages = tokens.map(token => ({
      to: token.token,
      sound: 'default',
      title: notificationTitle,
      body: notificationBody,
      data: { userId, senderName }
    }))

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messages)
    })

    const responseData = await response.json()
    console.log('Push notification response:', responseData)
  } catch (error) {
    console.error('Error sending push notification:', error)
  }
}
