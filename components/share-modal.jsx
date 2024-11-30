import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Alert,
  TextInput,
  Image,
  ActivityIndicator
} from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import * as SecureStore from 'expo-secure-store'
import { Ionicons } from '@expo/vector-icons'
import moment from 'moment-timezone'
import axios from 'axios'

const ShareModal = ({ visible, onClose, onShare, selectedMonthRoster, currentMonthYear }) => {
  const [connections, setConnections] = useState([])
  const [filteredConnections, setFilteredConnections] = useState([])
  const [selectedConnections, setSelectedConnections] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentUserId, setCurrentUserId] = useState(null)
  const [loading, setLoading] = useState(false)

  console.log(currentMonthYear)

  const ws = useRef(null)

  useEffect(() => {
    ws.current = new WebSocket('ws://172.20.10.2:8080')

    ws.current.onopen = () => {
      console.log('WebSocket connected')
    }

    ws.current.onmessage = event => {
      console.log('WebSocket message received:', event.data)
    }

    ws.current.onerror = error => {
      console.error('WebSocket error:', error)
    }

    ws.current.onclose = () => {
      console.log('WebSocket disconnected')
    }

    return () => {
      if (ws.current) {
        ws.current.close()
      }
    }
  }, [])

  const fetchConnections = async () => {
    try {
      const userId = await SecureStore.getItemAsync('userId')
      setCurrentUserId(userId)
      setLoading(true)
      const response = await axios.get(`https://40c7-115-164-76-186.ngrok-free.app/api/users/friendList/${userId}`)
      console.log(response.data)
      setConnections(response.data)
      setFilteredConnections(response.data)
    } catch (error) {
      console.error('Error fetching connections:', error)
      Alert.alert('Error', 'Could not fetch connections. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const toggleSelection = id => {
    setSelectedConnections(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]))
  }

  const handleSearch = query => {
    setSearchQuery(query)
    const filtered = connections.filter(
      connection =>
        connection.firstName.toLowerCase().includes(query.toLowerCase()) ||
        connection.lastName.toLowerCase().includes(query.toLowerCase()) ||
        connection.email.toLowerCase().includes(query.toLowerCase())
    )
    setFilteredConnections(filtered)
  }

  const handleShare = () => {
    if (selectedConnections.length === 0) {
      Alert.alert('No Selection', 'Please select at least one connection.')
      return
    }

    try {
      // Map for entry types to emojis
      const typeEmojis = {
        FLIGHT_DUTY: '✈️',
        GROUND_DUTY: '🚐',
        TRAINING: '📘',
        LEAVE: '🌴',
        MEETING: '📅',
        DEFAULT: '📌' // Fallback emoji
      }

      // Filter the roster based on the currentMonthYear
      const filteredRoster = Object.entries(selectedMonthRoster).filter(([date]) => {
        const entryMonthYear = moment(date).format('YYYY-MM')
        return entryMonthYear === currentMonthYear
      })

      if (filteredRoster.length === 0) {
        Alert.alert('No Data', 'No roster entries available for the selected month.')
        return
      }

      // Format the filtered roster into a well-structured message
      const formattedRoster = filteredRoster
        .map(([date, entries]) => {
          const formattedDate = moment(date).format('MMMM D, YYYY') // Format the date
          const formattedEntries = entries
            .map(entry => {
              const emoji = typeEmojis[entry.type] || typeEmojis.DEFAULT // Get emoji for type
              return `${emoji} **${entry.type}**\n   ✈️ ${entry.origin?.IATA || 'N/A'} ➡️ ${entry.destination?.IATA || 'N/A'}\n   🕒 ${moment(entry.departureTime).format('HH:mm')} - ${moment(entry.arrivalTime).format('HH:mm')}`
            })
            .join('\n\n') // Add extra spacing between entries
          return `📅 **${formattedDate}**\n${formattedEntries}` // Add emoji and bold date
        })
        .join('\n\n') // Separate different days

      const messageContent = `📋 **Here is my roster for ${moment(currentMonthYear, 'YYYY-MM').format('MMMM YYYY')}:**\n\n${formattedRoster}`

      // Iterate through each selected recipient and send the message individually
      selectedConnections.forEach(recipientId => {
        const messagePayload = {
          type: 'chat_message',
          sender: currentUserId,
          recipient: recipientId, // Send to one recipient at a time
          content: messageContent,
          timestamp: new Date().toISOString()
        }

        // Check WebSocket state before sending
        if (ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify(messagePayload))
          console.log(`Message sent to recipient: ${recipientId}`)
        } else {
          console.error(`WebSocket connection is not open. Failed to send to ${recipientId}`)
        }
      })

      Alert.alert('Success', 'Roster shared successfully!')
      setSelectedConnections([]) // Clear selections after sharing
      onClose()
    } catch (error) {
      console.error('Error sharing roster:', error)
      Alert.alert('Error', 'Could not share the roster. Please try again.')
    }
  }

  useEffect(() => {
    if (visible) {
      fetchConnections()
    }
  }, [visible])

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="grey" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Share Your Roster</Text>
          <TextInput
            style={styles.searchBar}
            placeholder="Search connections..."
            placeholderTextColor="grey"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4386AD" />
            </View>
          ) : (
            <FlatList
              data={filteredConnections}
              keyExtractor={item => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.connectionItem, selectedConnections.includes(item._id) && styles.selectedItem]}
                  onPress={() => toggleSelection(item._id)}
                >
                  <Ionicons
                    name={selectedConnections.includes(item._id) ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={selectedConnections.includes(item._id) ? 'green' : '#ddd'}
                    style={styles.checkboxIcon}
                  />
                  <View style={styles.userDetails}>
                    <Image source={{ uri: item.profilePicture }} style={styles.profilePicture} />
                    <View>
                      <Text style={styles.connectionName}>
                        {item.firstName} {item.lastName}
                      </Text>
                      <Text style={styles.connectionEmail}>{item.email}</Text>
                      <Text style={styles.connectionMeta}>
                        Homebase: {item.homebase.city} ({item.homebase.IATA})
                      </Text>
                      <Text style={styles.connectionMeta}>Role: {item.role.value}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={onClose}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.shareButton]} onPress={handleShare}>
              <Text style={styles.buttonText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalContent: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    height: '75%',
    position: 'relative'
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20
  },
  searchBar: {
    width: '100%',
    height: 40,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    color: 'grey'
  },
  connectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    width: '100%'
  },
  checkboxIcon: {
    marginRight: 15
  },
  userDetails: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  profilePicture: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15
  },
  connectionName: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  connectionEmail: {
    fontSize: 14,
    color: '#555'
  },
  connectionMeta: {
    fontSize: 12,
    color: '#888'
  },
  selectedItem: {
    backgroundColor: '#f0f8ff'
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20
  },
  modalButton: {
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelButton: {
    backgroundColor: '#FF5C5C'
  },
  shareButton: {
    backgroundColor: '#045D91'
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  }
})

export default ShareModal
