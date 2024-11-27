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
import React, { useState, useEffect, useRef } from 'react'
import { format, isToday, isYesterday } from 'date-fns'
import { useLocalSearchParams } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { debounce } from 'lodash'

const MessagingScreen = () => {
  const { firstName, lastName, id: recipientId, profilePicture } = useLocalSearchParams()
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [userId, setUserId] = useState(null)
  const [userStatus, setUserStatus] = useState('offline')
  const [drafts, setDrafts] = useState({})
  const [isAtBottom, setIsAtBottom] = useState(true) // Track if the user is viewing the bottom of the list

  const ws = useRef(null)
  const flatListRef = useRef(null)

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
        const response = await fetch(`https://40c7-115-164-76-186.ngrok-free.app/api/messages/${userId}/${recipientId}`)
        const data = await response.json()
        setMessages(data)
      } catch (error) {
        console.error('Failed to fetch messages:', error)
      }
    }

    fetchMessages()

    const setupWebSocket = () => {
      ws.current = new WebSocket('ws://localhost:8080')

      ws.current.onopen = () => {
        console.log('WebSocket connected')
        ws.current.send(JSON.stringify({ type: 'register', userId }))
      }

      ws.current.onmessage = event => {
        const data = JSON.parse(event.data)

        // Handle user status updates
        if (data.type === 'status_change' && data.userId === recipientId) {
          setUserStatus(data.status)
        }

        // Handle incoming chat messages
        if (data.type === 'chat_message') {
          setMessages(prevMessages => [...prevMessages, data])

          // Auto-scroll only if the user is already at the bottom
          if (isAtBottom) {
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        }
      }

      ws.current.onclose = () => {
        console.log('WebSocket disconnected. Reconnecting...')
        setTimeout(setupWebSocket, 3000) // Retry after 3 seconds
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

  const handleSendMessage = () => {
    if (inputText.trim()) {
      const message = {
        _id: Date.now().toString(),
        sender: { _id: userId },
        recipient: recipientId,
        content: inputText,
        timestamp: new Date().toISOString()
      }

      try {
        ws.current.send(JSON.stringify({ ...message, type: 'chat_message' }))
        setMessages(prevMessages => [...prevMessages, message])
        flatListRef.current?.scrollToEnd({ animated: true })

        setInputText('')
        setDrafts(prevDrafts => ({
          ...prevDrafts,
          [recipientId]: ''
        }))

        SecureStore.deleteItemAsync(`draft_${recipientId}`).catch(error =>
          console.error('Error clearing draft:', error)
        )
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

  const renderItem = ({ item }) => {
    if (item.type === 'header') {
      return <Text style={styles.dateHeader}>{item.date}</Text>
    }

    const { message } = item
    const isMe = String(message.sender._id) === String(userId)

    return (
      <View style={[styles.messageContainer, isMe ? styles.myMessageContainer : styles.theirMessageContainer]}>
        <Text style={isMe ? styles.myMessageText : styles.theirMessageText}>{message.content}</Text>
        <Text style={styles.timestamp}>{format(new Date(message.timestamp), 'h:mm a')}</Text>
      </View>
    )
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 70} // Adjust based on header height
      >
        {/* Chat Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton}></TouchableOpacity>
          <View style={styles.profileImageContainer}>
            <Image
              source={
                profilePicture
                  ? { uri: profilePicture }
                  : { uri: 'https://avatars.githubusercontent.com/u/92809183?v=4' }
              }
              style={styles.profileImage}
            />
            {/* Status Dot */}
            <View
              style={[
                styles.statusDot,
                { backgroundColor: userStatus === 'online' ? '#4CAF50' : '#B0BEC5' } // Green for online, grey for offline
              ]}
            />
          </View>
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
          keyboardShouldPersistTaps="handled"
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
    marginTop: 5,
    textAlign: 'right'
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
    borderColor: '#00000080', // Black with 50% opacity
    borderRadius: 10,
    backgroundColor: '#ffffff'
  }
})