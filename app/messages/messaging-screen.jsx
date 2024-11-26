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
  Keyboard
} from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { format, isToday, isYesterday } from 'date-fns'
import { useLocalSearchParams } from 'expo-router'
import * as SecureStore from 'expo-secure-store'

const MessagingScreen = () => {
  const { firstName, lastName, id: recipientId } = useLocalSearchParams()
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [userId, setUserId] = useState(null)
  const ws = useRef(null)
  const flatListRef = useRef(null)

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

    ws.current = new WebSocket('ws://localhost:8080')

    ws.current.onopen = () => {
      console.log('WebSocket connected')
      ws.current.send(JSON.stringify({ type: 'register', userId }))
    }

    ws.current.onmessage = event => {
      console.log('Received message from WebSocket:', event.data)
      const message = JSON.parse(event.data)

      setMessages(prevMessages => {
        const exists = prevMessages.some(msg => msg._id === message._id)
        if (exists) {
          return prevMessages
        }
        return [...prevMessages, message]
      })

      flatListRef.current?.scrollToEnd({ animated: true })
    }

    ws.current.onclose = () => {
      console.log('WebSocket disconnected')
    }

    return () => {
      ws.current.close()
    }
  }, [userId])

  const handleSendMessage = () => {
    if (inputText.trim()) {
      const message = {
        _id: Date.now().toString(),
        sender: { _id: userId },
        recipient: recipientId,
        content: inputText,
        timestamp: new Date().toISOString()
      }

      console.log('Sending message:', message)

      setMessages(prevMessages => [...prevMessages, message])

      flatListRef.current?.scrollToEnd({ animated: true })

      ws.current.send(JSON.stringify(message))

      setInputText('')
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
          <Text style={styles.headerText}>
            Chatting with {firstName} {lastName}
          </Text>
        </View>

        {/* Messages List */}
        <FlatList
          ref={flatListRef} // Reference to scroll programmatically
          data={getFlatListData()}
          keyExtractor={(item, index) => (item.type === 'header' ? `header-${item.date}` : item.message._id)}
          renderItem={renderItem}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          keyboardShouldPersistTaps="handled"
        />

        {/* Input Field */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type your message..."
            value={inputText}
            onChangeText={setInputText}
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
    padding: 15,
    backgroundColor: '#045D91',
    alignItems: 'center'
  },
  headerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
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
