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
import { encodeBase64, decodeBase64 } from 'tweetnacl-util'
import React, { useState, useEffect, useRef } from 'react'
import * as SecureStore from 'expo-secure-store'
import { DUTY_TYPES } from '@/constants/duties'
import { Ionicons } from '@expo/vector-icons'
import 'react-native-get-random-values'
import moment from 'moment-timezone'
import nacl from 'tweetnacl'
import axios from 'axios'

const ShareModal = ({ visible, onClose, selectedMonthRoster, currentMonthYear }) => {
  const [connections, setConnections] = useState([])
  const [filteredConnections, setFilteredConnections] = useState([])
  const [selectedConnections, setSelectedConnections] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentUserId, setCurrentUserId] = useState(null)
  const [keyPair, setKeyPair] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false) // State for instructions modal

  const ws = useRef(null)

  useEffect(() => {
    ws.current = new WebSocket('wss://b17e-47-128-181-39.ngrok-free.appp')

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

  useEffect(() => {
    const fetchKeys = async () => {
      const userId = await SecureStore.getItemAsync('userId')
      setCurrentUserId(userId)

      const response = await fetch(`https://b17e-47-128-181-39.ngrok-free.app/api/key/keys/${userId}`)
      const data = await response.json()

      setKeyPair({
        publicKey: decodeBase64(data.publicKey),
        secretKey: decodeBase64(data.secretKey)
      })
    }

    fetchKeys()
  }, [])

  const fetchConnections = async () => {
    try {
      const userId = await SecureStore.getItemAsync('userId')
      setCurrentUserId(userId)
      setLoading(true)
      const response = await axios.get(`https://b17e-47-128-181-39.ngrok-free.app/api/users/friendList/${userId}`)
      setConnections(response.data)
      setFilteredConnections(response.data)
    } catch (error) {
      console.error('Error fetching connections:', error)
      Alert.alert('Error', 'Could not fetch connections. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const fetchRecipientPublicKey = async recipientId => {
    const response = await fetch(`https://b17e-47-128-181-39.ngrok-free.app/api/key/keys/${recipientId}`)
    const data = await response.json()
    return decodeBase64(data.publicKey)
  }

  const encryptMessage = (message, recipientPublicKey) => {
    const nonce = nacl.randomBytes(24)
    const encryptedMsg = nacl.box(new Uint8Array(Buffer.from(message)), nonce, recipientPublicKey, keyPair.secretKey)
    return {
      encryptedContent: encodeBase64(encryptedMsg),
      nonce: encodeBase64(nonce)
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

  const formatRoster = async (roster, monthYear) => {
    const typeEmojis = {
      FLIGHT_DUTY: '✈️',
      STANDBY: '⏳',
      TRAINING: '📘',
      OFF_DUTY: '🛌',
      LAYOVER: '🏨',
      MEDICAL_CHECK: '🩺',
      MEETING: '📝',
      DEFAULT: '📌'
    }

    const homebaseTZDatabase = await SecureStore.getItemAsync('homebaseTZDatabase') // Retrieve homebase timezone

    // Filter and flatten the roster for the selected month
    const filteredRoster = Object.entries(roster)
      .filter(([date]) => moment(date).format('YYYY-MM') === monthYear)
      .flatMap(([date, entries]) =>
        entries.map(entry => ({
          ...entry,
          date,
          sortTime: entry.departureTime || entry.startTime || entry.arrivalTime // Choose the earliest time for sorting
        }))
      )

    if (filteredRoster.length === 0) return null

    // Sort the roster by date and time
    filteredRoster.sort((a, b) => {
      const dateA = moment(a.date).toDate()
      const dateB = moment(b.date).toDate()
      const timeA = a.sortTime ? moment(a.sortTime).toDate() : null
      const timeB = b.sortTime ? moment(b.sortTime).toDate() : null

      return dateA - dateB || (timeA && timeB ? timeA - timeB : 0)
    })

    // Group duties by date
    const groupedByDate = filteredRoster.reduce((acc, entry) => {
      if (!acc[entry.date]) acc[entry.date] = []
      acc[entry.date].push(entry)
      return acc
    }, {})

    // Format the grouped roster
    const formattedRoster = Object.entries(groupedByDate)
      .map(([date, entries]) => {
        const formattedDate = moment(date).format('MMMM D, YYYY')

        const duties = entries
          .map(entry => {
            const emoji = typeEmojis[entry.type] || typeEmojis.DEFAULT
            const dutyLabel = DUTY_TYPES.find(duty => duty.value === entry.type)?.label || entry.type

            // Construct route information
            let routeInfo = ''
            if (entry.type === 'FLIGHT_DUTY') {
              if (entry.origin?.IATA && entry.destination?.IATA) {
                routeInfo = `🛫 ${entry.origin.IATA} ➡️ ${entry.destination.IATA}`
              } else if (entry.origin?.IATA) {
                routeInfo = `🛫 From ${entry.origin.IATA}`
              } else if (entry.destination?.IATA) {
                routeInfo = `🛫 To ${entry.destination.IATA}`
              }
            }

            const originTZ = entry.origin?.tz_database || homebaseTZDatabase || 'UTC'
            const destinationTZ = entry.destination?.tz_database || homebaseTZDatabase || 'UTC'

            // Format times
            let timeInfo = ''
            if (entry.type === 'FLIGHT_DUTY') {
              const departureTime = entry.departureTime
                ? `Departure: ${moment(entry.departureTime).tz(originTZ).format('HH:mm [GMT]Z')}`
                : null
              const arrivalTime = entry.arrivalTime
                ? `Arrival: ${moment(entry.arrivalTime).tz(destinationTZ).format('HH:mm [GMT]Z')}`
                : null

              if (departureTime && arrivalTime) {
                timeInfo = `${departureTime}\n${arrivalTime}`
              } else if (departureTime) {
                timeInfo = departureTime
              }
            } else {
              const startTime = entry.departureTime
                ? `Start: ${moment(entry.departureTime).tz(originTZ).format('HH:mm [GMT]Z')}`
                : null
              const endTime = entry.arrivalTime
                ? `End: ${moment(entry.arrivalTime).tz(destinationTZ).format('HH:mm [GMT]Z')}`
                : null

              if (startTime && endTime) {
                timeInfo = `${startTime}\n${endTime}`
              } else if (startTime) {
                timeInfo = startTime
              }
            }

            return `${emoji} **${dutyLabel}**\n${routeInfo}${routeInfo && timeInfo ? '\n' : ''}${timeInfo}`
          })
          .join('\n\n')

        return `📅 **${formattedDate}**\n${duties}`
      })
      .join('\n\n')

    // Add a header to the formatted roster
    return `**Here is my roster for ${moment(monthYear, 'YYYY-MM').format('MMMM YYYY')}**\n\n${formattedRoster}`
  }

  const handleShare = async () => {
    if (selectedConnections.length === 0) {
      Alert.alert('No Selection', 'Please select at least one connection.')
      return
    }

    const formattedRoster = await formatRoster(selectedMonthRoster, currentMonthYear)
    if (!formattedRoster) {
      Alert.alert('No Data', 'No roster entries available for the selected month.')
      return
    }

    try {
      for (const recipientId of selectedConnections) {
        const recipientPublicKey = await fetchRecipientPublicKey(recipientId)
        const { encryptedContent, nonce } = encryptMessage(formattedRoster, recipientPublicKey)

        const messagePayload = {
          type: 'chat_message',
          sender: currentUserId,
          recipient: recipientId,
          encryptedContent,
          nonce,
          plainText: formattedRoster,
          timestamp: new Date().toISOString()
        }

        if (ws.current.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify(messagePayload))
        } else {
          console.error(`WebSocket connection is not open. Failed to send to ${recipientId}`)
        }
      }

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
          <TouchableOpacity style={styles.infoButton} onPress={() => setShowInstructions(true)}>
            <Ionicons name="information-circle-outline" size={24} color="grey" />
          </TouchableOpacity>
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

        {/* Instructions Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showInstructions}
          onRequestClose={() => setShowInstructions(false)}
        >
          <View style={styles.instructionsOverlay}>
            <View style={styles.instructionsContent}>
              <Text style={styles.instructionsTitle}>How to Share Your Roster</Text>
              <Text style={styles.instructionsText}>
                1. Select the month in the Roster page.
                {'\n\n'}
                2. Select the connections you would like to share with.
                {'\n\n'}
                3. Once you’ve made your selection, tap the "Share" button to send your roster.
                {'\n\n'}
                4. Ensure your roster data is for the correct month before sharing.
              </Text>
              <TouchableOpacity
                style={[styles.modalButton, styles.closeInstructionsButton]}
                onPress={() => setShowInstructions(false)}
              >
                <Text style={styles.closeInstructionsText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  infoButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    zIndex: 10
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
  },

  instructionsOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  instructionsContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    alignItems: 'center'
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  instructionsText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'left',
    lineHeight: 24
  },
  closeInstructionsButton: {
    backgroundColor: '#045D91',
    marginTop: 20,
    padding: 10,
    borderRadius: 10
  },
  closeInstructionsText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  }
})

export default ShareModal
