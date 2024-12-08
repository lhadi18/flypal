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
import { DUTY_TYPES } from '@/constants/duties'
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

  const ws = useRef(null)

  useEffect(() => {
    ws.current = new WebSocket('ws://10.164.238.244:8080')

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

  const getDutyLabel = type => {
    const duty = DUTY_TYPES.find(duty => duty.value === type)
    return duty ? duty.label : type
  }

  const handleShare = () => {
    if (selectedConnections.length === 0) {
      Alert.alert('No Selection', 'Please select at least one connection.')
      return
    }

    try {
      const typeEmojis = {
        FLIGHT_DUTY: '✈️',
        GROUND_DUTY: '🚐',
        TRAINING: '📘',
        LEAVE: '🌴',
        MEETING: '📅',
        DEFAULT: '📌'
      }

      const filteredRoster = Object.entries(selectedMonthRoster).filter(([date]) => {
        const entryMonthYear = moment(date).format('YYYY-MM')
        return entryMonthYear === currentMonthYear
      })

      if (filteredRoster.length === 0) {
        Alert.alert('No Data', 'No roster entries available for the selected month.')
        return
      }

      const formattedRoster = filteredRoster
        .map(([date, entries]) => {
          const formattedDate = moment(date).format('MMMM D, YYYY')
          const formattedEntries = entries
            .map(entry => {
              const emoji = typeEmojis[entry.type] || typeEmojis.DEFAULT
              const dutyLabel = getDutyLabel(entry.type) // Use the label
              return `${emoji} **${dutyLabel}**\n   ✈️ ${entry.origin?.IATA || 'N/A'} ➡️ ${entry.destination?.IATA || 'N/A'}\n   🕒 ${moment(entry.departureTime).format('HH:mm')} - ${moment(entry.arrivalTime).format('HH:mm')}`
            })
            .join('\n\n')
          return `📅 **${formattedDate}**\n${formattedEntries}`
        })
        .join('\n\n')

      const messageContent = `📋 **Here is my roster for ${moment(currentMonthYear, 'YYYY-MM').format('MMMM YYYY')}:**\n\n${formattedRoster}`

      selectedConnections.forEach(recipientId => {
        const messagePayload = {
          type: 'chat_message',
          sender: currentUserId,
          recipient: recipientId,
          content: messageContent,
          timestamp: new Date().toISOString()
        }

        if (ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify(messagePayload))
          console.log(`Message sent to recipient: ${recipientId}`)
        } else {
          console.error(`WebSocket connection is not open. Failed to send to ${recipientId}`)
        }
      })

      Alert.alert('Success', 'Roster shared successfully!')
      setSelectedConnections([])
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
              <Text style={styles.cancelButtonText}>Cancel</Text>
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
    width: '100%',
    marginTop: 20
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    width: '48%',
    justifyContent: 'center',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,

    elevation: 5
  },
  cancelButton: {
    backgroundColor: 'white',
    borderColor: 'grey',
    borderWidth: 1
  },
  shareButton: {
    backgroundColor: '#045D91'
  },
  buttonText: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: 16
  },
  cancelButtonText: {
    color: 'grey',
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
