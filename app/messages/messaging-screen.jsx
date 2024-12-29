import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native'
import { encodeBase64, decodeBase64 } from 'tweetnacl-util'
import React, { useState, useEffect, useRef } from 'react'
import { format, isToday, isYesterday } from 'date-fns'
import ProfileModal from '@/components/profile-modal'
import { useLocalSearchParams } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { box, randomBytes } from 'tweetnacl'
import 'react-native-get-random-values'
import { debounce } from 'lodash'
import { Buffer } from 'buffer'
import nacl from 'tweetnacl'
global.Buffer = Buffer

const READ_RECEIPT_ICON = require('../../assets/icons/read-receipt.png')

const MessagingScreen = () => {
  const {
    id: recipientId,
    firstName,
    lastName,
    profilePicture,
    email,
    role,
    airline,
    homebase
  } = useLocalSearchParams()
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [userId, setUserId] = useState(null)
  const [userStatus, setUserStatus] = useState('offline')
  const [drafts, setDrafts] = useState({})
  const [isAtBottom, setIsAtBottom] = useState(true)
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [keyPair, setKeyPair] = useState(null)
  const [recipientPublicKey, setRecipientPublicKey] = useState(null)

  const ws = useRef(null)
  const flatListRef = useRef(null)

  useEffect(() => {
    const initializeKeys = async () => {
      try {
        let privateKeyStr = null

        // Attempt to fetch private key from the server
        const response = await fetch(
          `https://4f4f-2402-1980-248-e007-c463-21a9-3b03-bc3b.ngrok-free.app/api/key/keys/${userId}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          }
        )

        if (response.ok) {
          const data = await response.json()
          if (data.secretKey) {
            privateKeyStr = data.secretKey
          }
        }

        if (privateKeyStr) {
          // If private key is found on the server, use it
          const privateKey = decodeBase64(privateKeyStr)
          const publicKey = nacl.box.keyPair.fromSecretKey(privateKey).publicKey

          // console.log('Loaded existing key pair from server:');
          // console.log('Public Key:', encodeBase64(publicKey));
          // console.log('Secret Key:', encodeBase64(privateKey));

          setKeyPair({
            publicKey,
            secretKey: privateKey
          })
        } else {
          // Generate a new key pair
          const newKeyPair = nacl.box.keyPair()
          const encodedSecretKey = encodeBase64(newKeyPair.secretKey)
          const encodedPublicKey = encodeBase64(newKeyPair.publicKey)

          // console.log('Generated new key pair:');
          // console.log('Public Key:', encodedPublicKey);
          // console.log('Secret Key:', encodedSecretKey);

          // Prepare data to send to the server
          const payload = {
            userId,
            secretKey: encodedSecretKey,
            publicKey: encodedPublicKey
          }

          // Store public key and secret key on the server
          const response = await fetch(
            'https://4f4f-2402-1980-248-e007-c463-21a9-3b03-bc3b.ngrok-free.app/api/key/keys',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            }
          )

          const responseData = await response.json()

          if (!response.ok) {
            throw new Error(`Failed to store keys on server: ${responseData.error || 'Unknown error'}`)
          }

          setKeyPair(newKeyPair)
        }
      } catch (error) {
        console.error('Error initializing keys:', error)
      }
    }

    if (userId) {
      initializeKeys()
    }
  }, [userId])

  useEffect(() => {
    const fetchRecipientKey = async () => {
      try {
        const response = await fetch(
          `https://4f4f-2402-1980-248-e007-c463-21a9-3b03-bc3b.ngrok-free.app/api/key/keys/${recipientId}`
        )
        const data = await response.json()
        setRecipientPublicKey(decodeBase64(data.publicKey))
      } catch (error) {
        console.error('Error fetching recipient key:', error)
      }
    }

    if (recipientId) {
      fetchRecipientKey()
    }
  }, [recipientId])

  const encryptMessage = message => {
    const nonce = randomBytes(24)
    const encryptedMsg = box(new Uint8Array(Buffer.from(message)), nonce, recipientPublicKey, keyPair.secretKey)
    return {
      encryptedContent: encodeBase64(encryptedMsg),
      nonce: encodeBase64(nonce)
    }
  }

  const decryptMessage = (encryptedContent, nonce, senderPublicKey) => {
    try {
      // console.log('Attempting to decrypt message...');
      // console.log('Encrypted Content:', encryptedContent);
      // console.log('Nonce:', nonce);
      // console.log('Sender Public Key:', encodeBase64(senderPublicKey));
      // console.log('Recipient Secret Key:', encodeBase64(keyPair.secretKey));

      const decrypted = box.open(
        decodeBase64(encryptedContent),
        decodeBase64(nonce),
        senderPublicKey,
        keyPair.secretKey
      )

      if (!decrypted) {
        throw new Error('Failed to decrypt message: Decryption returned null')
      }

      const decryptedMessage = Buffer.from(decrypted).toString()
      console.log('Decrypted Message:', decryptedMessage)
      return decryptedMessage
    } catch (error) {
      console.error('Error decrypting message:', error)
      return '[Unable to decrypt message]'
    }
  }

  useEffect(() => {
    const loadDraft = async () => {
      try {
        const savedDraft = await SecureStore.getItemAsync(`draft_${recipientId}`)
        if (savedDraft) {
          setInputText(savedDraft)
        }
      } catch (error) {
        console.error('Error loading draft:', error)
      }
    }

    loadDraft()
  }, [recipientId])

  useEffect(() => {
    return () => {
      SecureStore.setItemAsync(`draft_${recipientId}`, inputText).catch(error =>
        console.error('Error autosaving draft on unmount:', error)
      )
    }
  }, [inputText, recipientId])

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedUserId = await SecureStore.getItemAsync('userId')
        if (storedUserId) {
          setUserId(storedUserId)
        } else {
          console.error('User ID not found in SecureStore')
        }
      } catch (error) {
        console.error('Error fetching userId:', error)
      }
    }

    fetchUserId()
  }, [])

  // Fetch message history and setup WebSocket
  useEffect(() => {
    if (!userId) return

    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `https://4f4f-2402-1980-248-e007-c463-21a9-3b03-bc3b.ngrok-free.app/api/messages/${userId}/${recipientId}`
        )
        const data = await response.json()
        setMessages(data)
      } catch (error) {
        console.error('Failed to fetch messages:', error)
      }
    }

    fetchMessages()

    const setupWebSocket = () => {
      ws.current = new WebSocket('ws://10.164.234.23:8080')

      ws.current.onopen = () => {
        // console.log('WebSocket connected')
        ws.current.send(JSON.stringify({ type: 'register', userId }))
      }

      ws.current.onmessage = event => {
        // console.log('Raw WebSocket Message:', event.data); // Log raw message
        const data = JSON.parse(event.data)
        // console.log('Parsed WebSocket Message:', data);

        if (data.type === 'online_users') {
          data.users.forEach(user => {
            // Update user statuses based on the online_users list
            if (user.userId === recipientId) {
              setUserStatus('online')
            }
          })
        }

        if (data.type === 'status_change' && data.userId === recipientId) {
          setUserStatus(data.status)
        }

        // Handle incoming chat messages
        if (data.type === 'chat_message') {
          // console.log('Incoming Chat Message:', data);
          // console.log(data.encryptedContent)
          // console.log(data.nonce)

          if (!data.encryptedContent || !data.nonce) {
            console.error('Encrypted content or nonce is missing in the message:', data)
            return
          }

          setMessages(prevMessages => [...prevMessages, data])

          // console.log('Message added to state:', data);

          // Auto-scroll only if the user is already at the bottom
          if (isAtBottom) {
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        }

        if (data.type === 'read_receipt') {
          setMessages(prevMessages =>
            prevMessages.map(message => (data.messageIds.includes(message._id) ? { ...message, read: true } : message))
          )
        }
      }

      ws.current.onclose = () => {
        // console.log('WebSocket disconnected. Reconnecting...')
        setTimeout(setupWebSocket, 3000)
      }
    }

    setupWebSocket()

    return () => {
      ws.current?.close()
    }
  }, [userId])

  const handleInputChange = text => {
    setInputText(text)
    setDrafts(prevDrafts => ({
      ...prevDrafts,
      [recipientId]: text
    }))
    debouncedSaveDraft(`draft_${recipientId}`, text)
  }

  const debouncedSaveDraft = debounce((key, value) => {
    SecureStore.setItemAsync(key, value).catch(error => console.error('Error saving draft:', error))
  }, 300)

  const handleSendMessage = async () => {
    if (inputText.trim() && keyPair && recipientPublicKey) {
      const startTime = Date.now()
      console.log('Start sending message:', startTime)

      const { encryptedContent, nonce } = encryptMessage(inputText)
      console.log('Encryption completed in:', Date.now() - startTime, 'ms')

      const message = {
        _id: Date.now().toString(),
        sender: { _id: userId },
        recipient: recipientId,
        encryptedContent,
        nonce,
        plainText: inputText,
        timestamp: new Date().toISOString(),
        read: false
      }

      try {
        const sendStart = Date.now()
        ws.current.send(JSON.stringify({ ...message, type: 'chat_message' }))
        console.log('WebSocket send took:', Date.now() - sendStart, 'ms')

        const stateUpdateStart = Date.now()
        setMessages(prevMessages => [
          ...prevMessages,
          {
            ...message,
            content: inputText
          }
        ])
        console.log('State update took:', Date.now() - stateUpdateStart, 'ms')

        // Performance issue for this
        // const secureStoreStart = Date.now()
        // await SecureStore.deleteItemAsync(`draft_${recipientId}`)
        // console.log('SecureStore delete took:', Date.now() - secureStoreStart, 'ms')

        const endTime = Date.now()
        console.log('Total time to send message:', endTime - startTime, 'ms')

        setInputText('')
        setDrafts(prevDrafts => ({ ...prevDrafts, [recipientId]: '' }))
      } catch (error) {
        console.error('Failed to send message:', error)
      }
    }
  }

  const groupMessagesByDate = messages => {
    const grouped = {}

    messages.forEach(message => {
      const messageDate = new Date(message.timestamp)
      const formattedDate = isToday(messageDate)
        ? 'Today'
        : isYesterday(messageDate)
          ? 'Yesterday'
          : format(messageDate, 'MMMM d, yyyy')

      if (!grouped[formattedDate]) {
        grouped[formattedDate] = []
      }
      grouped[formattedDate].push(message)
    })

    return Object.entries(grouped).map(([date, messages]) => ({ date, messages }))
  }

  const TimestampWithReadReceipt = ({ timestamp, isRead }) => (
    <View style={styles.timestampContainer}>
      {isRead ? <Image source={READ_RECEIPT_ICON} style={styles.readReceiptIcon} /> : null}
      <Text style={styles.timestamp}>{format(new Date(timestamp), 'h:mm a')}</Text>
    </View>
  )

  const markMessagesAsRead = async visibleMessages => {
    const unreadMessages = visibleMessages
      .filter(item => item.item.type === 'message' && !item.item.message.read)
      .map(item => item.item.message._id)

    if (unreadMessages.length > 0) {
      ws.current.send(
        JSON.stringify({
          type: 'read_receipt',
          senderId: userId,
          recipientId: recipientId,
          messageIds: unreadMessages
        })
      )
    }
  }

  const onViewableItemsChanged = ({ viewableItems }) => {
    markMessagesAsRead(viewableItems)
  }

  const renderItem = ({ item }) => {
    if (item.type === 'header') {
      return <Text style={styles.dateHeader}>{item.date}</Text>
    }

    const { message } = item
    const isMe = String(message.sender._id) === String(userId)

    // Use stored decrypted content for sent messages
    const content = (() => {
      try {
        // console.log("message", message)
        return decryptMessage(
          message.encryptedContent,
          message.nonce,
          recipientPublicKey // Use sender's public key for received messages
        )
      } catch (error) {
        console.error('Failed to decrypt message:', error)
        return '[Unable to decrypt message]'
      }
    })()

    return (
      <View style={[styles.messageContainer, isMe ? styles.myMessageContainer : styles.theirMessageContainer]}>
        <Text style={isMe ? styles.myMessageText : styles.theirMessageText}>{content}</Text>
        <TimestampWithReadReceipt timestamp={message.timestamp} isRead={isMe && message.read} />
      </View>
    )
  }

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50
  }

  const getFlatListData = () => {
    const groupedMessages = groupMessagesByDate(messages)
    const flatData = []

    groupedMessages.forEach(({ date, messages }) => {
      flatData.push({ type: 'header', date })
      messages.forEach(message => flatData.push({ type: 'message', message }))
    })

    return flatData
  }

  const openProfileModal = () => {
    setSelectedUser({ firstName, lastName, profilePicture, email: 'example@example.com' })
    setIsProfileModalVisible(true)
  }

  const closeProfileModal = () => {
    setSelectedUser(null)
    setIsProfileModalVisible(false)
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 70} // Adjust based on header height
      >
        {/* Chat Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={openProfileModal}>
            <View style={styles.profileImageContainer}>
              <Image
                source={
                  profilePicture
                    ? { uri: profilePicture }
                    : { uri: 'https://avatars.githubusercontent.com/u/92809183?v=4' }
                }
                style={styles.profileImage}
              />
              <View style={[styles.statusDot, { backgroundColor: userStatus === 'online' ? '#4CAF50' : '#B0BEC5' }]} />
            </View>
          </TouchableOpacity>

          <View style={styles.headerTextContainer}>
            <Text style={styles.headerText}>
              {firstName} {lastName}
            </Text>
            <Text style={styles.statusText}>{userStatus === 'online' ? 'Online' : 'Offline'}</Text>
          </View>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef} // Reference to scroll programmatically
          data={getFlatListData()}
          keyExtractor={(item, index) => (item.type === 'header' ? `header-${item.date}` : item.message._id)}
          renderItem={renderItem}
          contentContainerStyle={styles.messagesList}
          onScroll={({ nativeEvent }) => {
            const { layoutMeasurement, contentOffset, contentSize } = nativeEvent
            setIsAtBottom(layoutMeasurement.height + contentOffset.y >= contentSize.height - 20)
          }}
          onContentSizeChange={() => {
            if (isAtBottom) {
              flatListRef.current?.scrollToEnd({ animated: true })
            }
          }}
          onViewableItemsChanged={onViewableItemsChanged}
          keyboardShouldPersistTaps="handled"
          viewabilityConfig={viewabilityConfig}
        />

        {/* Input Field */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type your message..."
            value={inputText}
            onChangeText={handleInputChange}
            onFocus={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />

          <TouchableOpacity onPress={handleSendMessage} style={styles.sendButton}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <ProfileModal
        visible={isProfileModalVisible}
        user={{
          firstName,
          lastName,
          profilePicture,
          email,
          role,
          airline,
          homebase
        }}
        onClose={closeProfileModal}
      />
    </SafeAreaView>
  )
}

export default MessagingScreen

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9f9f9'
  },
  container: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#045D91',
    elevation: 4 // For subtle shadow effect on Android
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerTextContainer: {
    marginLeft: 10
  },
  headerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 2
  },
  profileImageContainer: {
    position: 'relative', // Enable absolute positioning for the dot
    width: 40,
    height: 40
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e1e1e1'
  },
  statusDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2, // To create a border around the dot
    borderColor: '#fff', // Matches the background color of the profile image container
    bottom: 0,
    right: 0
  },
  messagesList: {
    flexGrow: 1,
    padding: 10
  },
  messageContainer: {
    marginBottom: 5,
    maxWidth: '70%',
    padding: 10,
    borderRadius: 10
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
    backgroundColor: '#045D91'
  },
  theirMessageContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#e1e1e1'
  },
  myMessageText: {
    color: '#fff',
    fontSize: 16
  },
  theirMessageText: {
    color: '#000',
    fontSize: 16
  },
  timestamp: {
    fontSize: 10,
    color: '#aaa',
    textAlign: 'right'
  },
  timestampContainer: {
    flexDirection: 'row-reverse',
    alignSelf: 'flex-end',
    alignItems: 'center',
    marginTop: 5
  },
  readReceiptIcon: {
    width: 16,
    height: 16,
    marginLeft: 5
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    backgroundColor: '#fff'
  },
  textInput: {
    flex: 1,
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10
  },
  sendButton: {
    backgroundColor: '#045D91',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16
  },
  dateHeader: {
    alignSelf: 'center',
    marginVertical: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#00000080',
    borderRadius: 10,
    backgroundColor: '#ffffff'
  }
})
