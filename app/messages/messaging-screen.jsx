import 'react-native-get-random-values'
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
import ProfileModal from '@/components/profile-modal'
import { useLocalSearchParams } from 'expo-router'
import * as SecureStore from 'expo-secure-store'
import { debounce } from 'lodash'
import {
  encryptMessage,
  decryptMessage,
} from '@/server/src/utils/encryption';


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
  

  const fetchRecipientPublicKey = async (recipientId) => {
    try {
      const response = await fetch(`https://4690-103-18-0-19.ngrok-free.app/api/keys/${recipientId}`);
      const { publicKey } = await response.json();
      if (!publicKey) {
        throw new Error('Recipient public key is missing from server response');
      }
      return publicKey;
    } catch (error) {
      console.error('Failed to fetch recipient public key:', error);
      throw error;
    }
  };
  
  
  const fetchSenderPublicKey = async (senderId) => {
    try {
      const response = await fetch(`https://4690-103-18-0-19.ngrok-free.app/api/keys/${senderId}`);
      const { publicKey } = await response.json();
      if (!publicKey) {
        throw new Error('Sender public key is missing from server response');
      }
      return publicKey;
    } catch (error) {
      console.error('Failed to fetch sender public key:', error);
      throw error;
    }
  };

  // Fetch message history and setup WebSocket
  useEffect(() => {
    if (!userId) return

    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `https://4690-103-18-0-19.ngrok-free.app/api/messages/${userId}/${recipientId}`
        );
        const data = await response.json();
    
        const decryptedMessages = await Promise.all(
          data.map(async (msg) => {
            try {
              if (!msg.content || !msg.nonce || !msg.sender || !msg.sender._id) {
                console.warn('Skipping message due to missing fields:', msg);
                return { ...msg, content: 'Failed to decrypt' };
              }
    
              // Determine whether the message is incoming or outgoing
              const isIncoming = msg.sender._id !== userId;
    
              // Fetch the correct private key based on the direction of the message
              const recipientPrivateKey = isIncoming
                ? await fetchRecipientPublicKey(userId) // Use logged-in user's private key
                : await fetchRecipientPublicKey(recipientId); // Use the other user's private key

              // Fetch the sender's public key
              const senderPublicKey = await fetchSenderPublicKey(
                isIncoming ? msg.sender._id : userId // If incoming, fetch the sender's key
              );
    
              // Decrypt the message
              const decryptedContent = decryptMessage(
                msg.content,
                msg.nonce,
                senderPublicKey,
                recipientPrivateKey
              );
    
              return {
                ...msg,
                content: decryptedContent || 'Failed to decrypt',
              };
            } catch (error) {
              console.error('Failed to decrypt a message:', error);
              return { ...msg, content: 'Failed to decrypt' };
            }
          })
        );
    
        setMessages(decryptedMessages);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };    
    
    fetchMessages()

    const setupWebSocket = () => {
      ws.current = new WebSocket('ws://10.171.59.126:8080')

      ws.current.onmessage = async (event) => {
        const data = JSON.parse(event.data);
      
        if (data.type === 'chat_message') {
          try {
            const recipientPrivateKey = await fetchRecipientPublicKey(recipientId);
            if (!recipientPrivateKey) {
              throw new Error('Recipient private key not found');
            }
      
            if (!data.content || !data.nonce || !data.sender || !data.sender._id) {
              throw new Error('Incomplete chat message data');
            }
      
            const senderPublicKey = await fetchSenderPublicKey(data.sender._id);
            if (!senderPublicKey) {
              throw new Error('Sender public key not found');
            }
      
            const decryptedMessage = decryptMessage(
              data.content,
              data.nonce,
              senderPublicKey,
              recipientPrivateKey
            );
      
            if (!decryptedMessage) {
              throw new Error('Decryption failed');
            }
      
            setMessages((prevMessages) => [
              ...prevMessages,
              {
                ...data,
                content: decryptedMessage,
              },
            ]);
      
            if (isAtBottom) {
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          } catch (error) {
            console.error('Decryption failed:', error.message);
      
            setMessages((prevMessages) => [
              ...prevMessages,
              {
                ...data,
                content: 'Failed to decrypt',
              },
            ]);
          }
        }      
      
        if (data.type === 'read_receipt') {
          setMessages((prevMessages) =>
            prevMessages.map((message) =>
              data.messageIds.includes(message._id) ? { ...message, read: true } : message
            )
          );
        }
      };
      ws.current.onclose = () => {
        console.log('WebSocket disconnected. Reconnecting...')
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
    if (inputText.trim()) {
      try {
        const senderPrivateKey = await fetchSenderPublicKey(userId);
        if (!senderPrivateKey) {
          throw new Error('Sender private key not found');
        }
  
        const recipientPublicKey = await fetchRecipientPublicKey(recipientId);
        if (!recipientPublicKey) {
          throw new Error('Recipient public key not found');
        }
  
        const { message: encryptedMessage, nonce } = encryptMessage(
          inputText,
          recipientPublicKey,
          senderPrivateKey
        );

        setMessages((prevMessages) => [
          ...prevMessages,
          {
            _id: Date.now().toString(),
            sender: { _id: userId },
            recipient: recipientId,
            content: inputText, // Add the original plain text here
            timestamp: new Date().toISOString(),
          },
        ]);
  
        if (!encryptedMessage || !nonce) {
          throw new Error('Encryption failed: Missing encrypted message or nonce');
        }
  
        const payload = {
          _id: Date.now().toString(),
          sender: { _id: userId },
          recipient: recipientId,
          message: encryptedMessage,
          nonce,
          timestamp: new Date().toISOString(),
          type: 'chat_message',
        };
  
        ws.current.send(JSON.stringify(payload));
  
        setInputText('');
        await SecureStore.deleteItemAsync(`draft_${recipientId}`);
      } catch (error) {
        console.error('Failed to send encrypted message:', error.message);
      }
    }
  };
  

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

  const handleViewableItemsChanged = async ({ viewableItems }) => {
    const readMessageIds = viewableItems
    .filter((item) => {
      console.log("Processing Item:", item); // Log each viewable item
      return (
        item.item.type === 'message' && 
        item.item.message.recipient._id === userId && 
        !item.item.message.read
      );
    })
    .map((item) => item.item.message._id);
      
      console.log('Viewable Items:', viewableItems);
      // console.log('Test:', JSON.stringify(viewableItems, null, 2));
      console.log('Read Message IDs:', readMessageIds);      

      if (readMessageIds.length > 0) {
        try {
          // Notify the server about the read messages
          const response = await fetch(
            `https://4690-103-18-0-19.ngrok-free.app/api/messages/read/${recipientId}/${userId}`, 
            {
              method: 'PATCH', // Ensure you match your router method (PATCH in this case)
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ messageIds: readMessageIds }),
            }
          );
      
          // Parse the server response
          const result = await response.json();
          console.log('Server Response:', result);
      
          console.log('Sending read receipt:', {
            messageIds: readMessageIds,
            recipientId,
            userId,
          });
      
          // Update local state to mark the messages as read
          setMessages((prevMessages) =>
            prevMessages.map((message) =>
              readMessageIds.includes(message._id) ? { ...message, read: true } : message
            )
          );
          console.log('Updated Messages:', messages);
      
          // Send WebSocket notification for read receipt
          ws.current.send(
            JSON.stringify({
              type: 'read_receipt',
              senderId: userId,
              recipientId,
              messageIds: readMessageIds,
            })
          );
          console.log('Sending WebSocket Read Receipt:', {
            type: 'read_receipt',
            senderId: userId,
            recipientId,
            messageIds: readMessageIds,
          });
        } catch (error) {
          console.error('Failed to mark messages as read:', error);
        }
      }      
    };

  const TimestampWithReadReceipt = ({ timestamp, isRead }) => (
    <View style={styles.timestampContainer}>
      {isRead && <Image source={READ_RECEIPT_ICON} style={styles.readReceiptIcon} />}
      <Text style={styles.timestamp}>{format(new Date(timestamp), 'h:mm a')}</Text>
    </View>
  )

  const renderItem = ({ item }) => {
    if (item.type === 'header') {
      return <Text style={styles.dateHeader}>{item.date}</Text>;
    }

    const { message } = item
    const isMe = String(message.sender._id) === String(userId)

    return (
      <View style={[styles.messageContainer, isMe ? styles.myMessageContainer : styles.theirMessageContainer]}>
        <Text style={isMe ? styles.myMessageText : styles.theirMessageText}>{message.content}</Text>
        <TimestampWithReadReceipt timestamp={message.timestamp} isRead={isMe && message.read} />
      </View>
    );
  };
  
  const viewabilityConfig = {
    itemVisiblePercentThreshold: 100
  }

  const getFlatListData = () => {
    const groupedMessages = groupMessagesByDate(messages)
    const flatData = []

    groupedMessages.forEach(({ date, messages }) => {
      flatData.push({ type: 'header', date })
      messages.forEach(message => flatData.push({ type: 'message', message }))
    })

    // console.log(flatData)

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
          keyboardShouldPersistTaps="handled"
          onViewableItemsChanged={handleViewableItemsChanged}
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
