import {
  SafeAreaView,
  SectionList,
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native'
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'
import DateTimePickerModal from 'react-native-modal-datetime-picker'
import { useNavigation, useRoute } from '@react-navigation/native'
import { fetchAircraftTypes } from '../../services/aircraft-api'
import AirportSearch from '@/components/airport-search'
import RNPickerSelect from 'react-native-picker-select'
import * as DocumentPicker from 'expo-document-picker'
import { CalendarList } from 'react-native-calendars'
import { DUTY_TYPES } from '../../constants/duties'
import * as SecureStore from 'expo-secure-store'
import { Ionicons } from '@expo/vector-icons'
import moment from 'moment-timezone'
import axios from 'axios'

const Roster = () => {
  const [selectedDate, setSelectedDate] = useState('')
  const [events, setEvents] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventOrigin, setNewEventOrigin] = useState(null)
  const [newEventDestination, setNewEventDestination] = useState(null)
  const [newEventDepartureTime, setNewEventDepartureTime] = useState('')
  const [newEventArrivalTime, setNewEventArrivalTime] = useState('')
  const [newEventFlightNumber, setNewEventFlightNumber] = useState('')
  const [newEventAircraftType, setNewEventAircraftType] = useState('')
  const [newEventNotes, setNewEventNotes] = useState('')
  const [document, setDocument] = useState(null)
  const [isDeparturePickerVisible, setDeparturePickerVisible] = useState(false)
  const [isArrivalPickerVisible, setArrivalPickerVisible] = useState(false)
  const [aircraftTypeData, setAircraftTypeData] = useState([])
  const [rosterEntries, setRosterEntries] = useState({})
  const [editMode, setEditMode] = useState(false)
  const [editEventId, setEditEventId] = useState(null)
  const [markedDates, setMarkedDates] = useState({})

  const originRef = useRef(null)
  const destinationRef = useRef(null)

  const navigation = useNavigation()
  const route = useRoute()

  useLayoutEffect(() => {
    if (route.params?.action) {
      if (route.params.action === 'pickDocument') {
        handlePickDocument()
      } else if (route.params.action === 'addEvent') {
        setModalVisible(true)
        setEditMode(false)
        clearInputs()
        clearOriginAndDestination()
      }
      navigation.setParams({ action: null }) // Reset action
    }
  }, [route.params])

  useEffect(() => {
    const today = getCurrentDate()
    setSelectedDate(today)
    fetchRosterEntries(today) // Fetch entries from 4 months ahead and 4 months behind
  }, [])

  useEffect(() => {
    fetchAircraftTypes()
      .then(data => {
        setAircraftTypeData(data)
      })
      .catch(error => {
        console.error('Error fetching aircraft types:', error)
      })
  }, [])

  useEffect(() => {
    const generateMarkedDates = () => {
      const dates = {}
      Object.keys(rosterEntries).forEach(date => {
        dates[date] = {
          marked: true,
          dotColor: '#50cebb', // Customize this color as needed
          activeOpacity: 0
        }
      })
      return dates
    }

    const markedDates = generateMarkedDates()
    setMarkedDates(markedDates)
  }, [rosterEntries])

  const fetchRosterEntries = async startDate => {
    const userId = await SecureStore.getItemAsync('userId')
    const start = moment(startDate).subtract(4, 'months').startOf('day')
    const end = moment(startDate).add(4, 'months').endOf('day')

    try {
      const response = await axios.get('https://b113-103-18-0-17.ngrok-free.app/api/roster/getRosterEntries', {
        params: {
          userId,
          startDate: start.toISOString(),
          endDate: end.toISOString()
        }
      })
      const rosterEntries = response.data.reduce((acc, entry) => {
        const date = moment(entry.departureTime).format('YYYY-MM-DD')
        if (!acc[date]) acc[date] = []
        acc[date].push(entry)
        return acc
      }, {})

      setRosterEntries(rosterEntries)
      if (startDate in rosterEntries) {
        setEvents(rosterEntries[startDate])
      } else {
        setEvents([])
      }
    } catch (error) {
      console.error('Error fetching roster entries:', error)
    }
  }

  const handleDayPress = day => {
    setSelectedDate(day.dateString)
    setEvents(rosterEntries[day.dateString] || [])
  }

  const getFormattedDate = dateString => {
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const monthsOfYear = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ]
    const date = new Date(dateString)
    const dayOfWeek = daysOfWeek[date.getDay()]
    const day = date.getDate()
    const month = monthsOfYear[date.getMonth()]
    const year = date.getFullYear()
    return `${dayOfWeek}, ${day} ${month} ${year}`
  }

  const getCurrentDate = () => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const getLocalTime = (time, timezone) => {
    return moment(time).tz(timezone).format('DD/MM/YYYY HH:mm [GMT]Z')
  }

  const handleDeleteEvent = rosterId => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this roster entry?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await axios.delete(`https://b113-103-18-0-17.ngrok-free.app/api/roster/deleteRosterEntry/${rosterId}`)
              const today = getCurrentDate()
              await fetchRosterEntries(today) // Refresh the entries
            } catch (error) {
              console.error('Error deleting event:', error)
            }
          }
        }
      ],
      { cancelable: true }
    )
  }

  const renderEventItem = ({ item, index }) => (
    <View style={[styles.eventItem, { backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9' }]}>
      <View style={styles.eventHeader}>
        <Text style={styles.eventFlightNumber}>
          {item.origin.IATA} <Ionicons name="airplane-outline" size={20} color="#045D91" /> {item.destination.IATA} (
          {item.flightNumber})
        </Text>
        <View style={styles.eventActions}>
          <TouchableOpacity style={styles.editButton} onPress={() => handleEditEvent(item)}>
            <Ionicons name="pencil-outline" size={20} color="#045D91" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteEvent(item._id)}>
            <Ionicons name="trash-outline" size={20} color="red" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.eventBody}>
        <View style={styles.eventRow}>
          <Ionicons name="time-outline" size={18} color="#045D91" />
          <Text style={[styles.eventText, styles.importantText]}>
            {getLocalTime(item.departureTime, item.origin.tz_database)}
          </Text>
        </View>
        <View style={styles.eventRow}>
          <Ionicons name="time-outline" size={18} color="#045D91" />
          <Text style={[styles.eventText, styles.importantText]}>
            {getLocalTime(item.arrivalTime, item.destination.tz_database)}
          </Text>
        </View>
        <View style={styles.eventRow}>
          <Ionicons name="location-outline" size={18} color="#045D91" />
          <Text style={styles.eventText}>
            From: {item.origin.name} ({item.origin.city}, {item.origin.country})
          </Text>
        </View>
        <View style={styles.eventRow}>
          <Ionicons name="location-outline" size={18} color="#045D91" />
          <Text style={styles.eventText}>
            To: {item.destination.name} ({item.destination.city}, {item.destination.country})
          </Text>
        </View>
        <View style={styles.eventRow}>
          <Ionicons name="airplane-outline" size={18} color="#045D91" />
          <Text style={styles.eventText}>Aircraft: {item.aircraftType.Model}</Text>
        </View>
        <View style={styles.eventRow}>
          <Ionicons name="clipboard-outline" size={18} color="#045D91" />
          <Text style={styles.eventText}>Notes: {item.notes}</Text>
        </View>
      </View>
    </View>
  )

  const handleEditEvent = event => {
    setEditMode(true)
    setEditEventId(event._id)
    setNewEventTitle(event.type)
    setNewEventOrigin({
      value: event.origin._id,
      label: `(${event.origin.IATA}/${event.origin.ICAO}) - ${event.origin.name}`,
      timezone: event.origin.tz_database
    })
    setNewEventDestination({
      value: event.destination._id,
      label: `(${event.destination.IATA}/${event.destination.ICAO}) - ${event.origin.name}`,
      timezone: event.destination.tz_database
    })
    setNewEventDepartureTime(event.departureTime)
    setNewEventArrivalTime(event.arrivalTime)
    setNewEventFlightNumber(event.flightNumber)
    setNewEventAircraftType({
      value: event.aircraftType._id,
      label: `${event.aircraftType.Model}`
    })
    setNewEventNotes(event.notes)
    setModalVisible(true)
  }

  const handleAddEvent = async () => {
    if (!newEventTitle) {
      console.error('Event title is required')
      return
    }

    const userId = await SecureStore.getItemAsync('userId')
    const newEvent = {
      userId,
      type: newEventTitle,
      origin: newEventOrigin?.value,
      destination: newEventDestination?.value,
      departureTime: newEventDepartureTime,
      arrivalTime: newEventArrivalTime,
      flightNumber: newEventFlightNumber,
      aircraftType: newEventAircraftType,
      notes: newEventNotes
    }

    try {
      if (editMode) {
        // Update existing event
        await axios.put(`https://b113-103-18-0-17.ngrok-free.app/api/roster/updateRosterEntry/${editEventId}`, newEvent)
      } else {
        // Create new event
        await axios.post('https://b113-103-18-0-17.ngrok-free.app/api/roster/createRosterEntry', newEvent)
      }

      clearInputs()
      clearOriginAndDestination()
      setModalVisible(false)
      // Fetch roster entries again
      const today = getCurrentDate()
      await fetchRosterEntries(today) // Fetch entries from 4 months ahead and 4 months behind
    } catch (error) {
      console.error('Error saving event:', error)
    }
  }

  const handleSelectOrigin = airport => {
    setNewEventOrigin(airport)
    setNewEventDepartureTime('')
  }

  const handleSelectDestination = airport => {
    setNewEventDestination(airport)
    setNewEventArrivalTime('')
  }

  const handlePickDocument = async () => {
    let result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'text/csv']
    })
    if (result.type === 'success') {
      setDocument(result)
    }
  }

  const handleConfirmDeparture = date => {
    if (!newEventOrigin) {
      Alert.alert('Select origin first!')
      return
    }

    const originTimezone = newEventOrigin.timezone
    const formattedDepartureDate = moment(date).tz(originTimezone).format('YYYY-MM-DDTHH:mm:ssZ')

    if (newEventArrivalTime) {
      const formattedArrivalDate = moment(newEventArrivalTime).format('YYYY-MM-DDTHH:mm:ssZ')

      if (moment(formattedDepartureDate).isAfter(moment(formattedArrivalDate))) {
        Alert.alert('Error', 'Departure time cannot be later than the arrival time.')
        return
      }
    }

    setNewEventDepartureTime(formattedDepartureDate)
    setDeparturePickerVisible(false)
  }

  const handleConfirmArrival = date => {
    if (!newEventDestination) {
      Alert.alert('Select destination first!')
      return
    }

    const destinationTimezone = newEventDestination.timezone
    const formattedArrivalDate = moment(date).tz(destinationTimezone).format('YYYY-MM-DDTHH:mm:ssZ')

    if (newEventDepartureTime) {
      const formattedDepartureDate = moment(newEventDepartureTime).format('YYYY-MM-DDTHH:mm:ssZ')

      if (moment(formattedArrivalDate).isBefore(moment(formattedDepartureDate))) {
        Alert.alert('Error', 'Arrival time cannot be earlier than the departure time.')
        return
      }
    }

    setNewEventArrivalTime(formattedArrivalDate)
    setArrivalPickerVisible(false)
  }

  const clearInputs = () => {
    setNewEventTitle('')
    setNewEventDepartureTime('')
    setNewEventArrivalTime('')
    setNewEventFlightNumber('')
    setNewEventAircraftType('')
    setNewEventNotes('')
    setEditMode(false)
    setEditEventId(null)
  }

  const clearOriginAndDestination = () => {
    if (originRef.current) originRef.current.clearSelection()
    if (destinationRef.current) destinationRef.current.clearSelection()
  }

  const confirmClearInputs = () => {
    Alert.alert(
      'Confirm Clear',
      'Are you sure you want to clear all inputs?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Yes',
          onPress: () => {
            clearInputs()
            clearOriginAndDestination()
          }
        }
      ],
      { cancelable: true }
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <SectionList
        sections={[{ title: selectedDate ? getFormattedDate(selectedDate) : '', data: events }]}
        keyExtractor={(item, index) => item._id}
        renderItem={renderEventItem}
        renderSectionHeader={({ section: { title } }) =>
          title ? (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{title}</Text>
            </View>
          ) : null
        }
        ListHeaderComponent={
          <>
            <CalendarList
              onDayPress={handleDayPress}
              markedDates={{
                ...markedDates,
                [selectedDate]: { selected: true, marked: false, selectedColor: '#F04D23' }
              }}
              horizontal
              pagingEnabled
              showScrollIndicator={false}
              theme={{
                'stylesheet.calendar.header': {
                  header: {
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    paddingLeft: 10,
                    paddingRight: 10,
                    marginTop: 15,
                    alignItems: 'center'
                  },
                  monthText: {
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: '#000'
                  },
                  arrow: {
                    padding: 10
                  },
                  week: {
                    marginTop: 15,
                    flexDirection: 'row',
                    justifyContent: 'space-around'
                  }
                }
              }}
            />
          </>
        }
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalView}>
          <ScrollView contentContainerStyle={styles.scrollViewContent}>
            <View style={styles.modalHeader}>
              <Ionicons name={editMode ? 'pencil-outline' : 'add-circle'} size={24} color="#045D91" />
              <Text style={styles.modalText}>{editMode ? 'Edit Roster Entry' : 'Add Roster Entry'}</Text>
              {!editMode && (
                <TouchableOpacity onPress={confirmClearInputs} style={styles.clearButton}>
                  <Ionicons name="trash-outline" size={24} color="red" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.divider} />

            <Text style={styles.label}>Duty Type</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="briefcase-outline" size={20} color="#045D91" style={styles.inputIcon} />
              <RNPickerSelect
                onValueChange={value => setNewEventTitle(value)}
                items={DUTY_TYPES.map(duty => ({ label: duty.label, value: duty.value }))}
                style={{
                  ...pickerSelectStyles,
                  inputIOS: {
                    ...pickerSelectStyles.inputIOS,
                    paddingRight: 30 // to ensure the text is never behind the icon
                  },
                  inputAndroid: {
                    ...pickerSelectStyles.inputAndroid,
                    paddingRight: 30 // to ensure the text is never behind the icon
                  },
                  placeholder: {
                    ...pickerSelectStyles.placeholder,
                    paddingLeft: 0 // Adjust to match the padding left of the input
                  }
                }}
                value={newEventTitle}
                placeholder={{ label: 'Select duty type', value: null }}
                useNativeAndroidPickerStyle={false} // to use the custom styles on Android
              />
            </View>

            <Text style={styles.label}>Origin</Text>
            <AirportSearch
              ref={originRef}
              placeholder="Enter origin"
              initialValue={newEventOrigin}
              onSelect={handleSelectOrigin}
            />
            <Text style={styles.label}>Destination</Text>
            <AirportSearch
              ref={destinationRef}
              placeholder="Enter destination"
              initialValue={newEventDestination}
              onSelect={handleSelectDestination}
            />
            <Text style={styles.label}>Departure Time (local time)</Text>
            <TouchableOpacity
              onPress={() => setDeparturePickerVisible(true)}
              style={[styles.datePicker, !newEventOrigin || !newEventDestination ? styles.disabledButton : {}]}
              disabled={!newEventOrigin || !newEventDestination}
            >
              <Ionicons name="time-outline" size={20} color="#045D91" style={styles.inputIcon} />
              <Text style={[styles.dateText, newEventDepartureTime ? {} : { color: 'grey' }]}>
                {newEventDepartureTime
                  ? `${getLocalTime(newEventDepartureTime, newEventOrigin?.timezone)}`
                  : 'Select departure time'}
              </Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={isDeparturePickerVisible}
              mode="datetime"
              onConfirm={handleConfirmDeparture}
              onCancel={() => setDeparturePickerVisible(false)}
            />

            <Text style={styles.label}>Arrival Time (local time)</Text>
            <TouchableOpacity
              onPress={() => setArrivalPickerVisible(true)}
              style={[styles.datePicker, !newEventOrigin || !newEventDestination ? styles.disabledButton : {}]}
              disabled={!newEventOrigin || !newEventDestination}
            >
              <Ionicons name="time-outline" size={20} color="#045D91" style={styles.inputIcon} />
              <Text style={[styles.dateText, newEventArrivalTime ? {} : { color: 'grey' }]}>
                {newEventArrivalTime
                  ? `${getLocalTime(newEventArrivalTime, newEventDestination?.timezone)}`
                  : 'Select arrival time'}
              </Text>
            </TouchableOpacity>
            <DateTimePickerModal
              isVisible={isArrivalPickerVisible}
              mode="datetime"
              onConfirm={handleConfirmArrival}
              onCancel={() => setArrivalPickerVisible(false)}
            />

            <Text style={styles.label}>Flight Number</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="airplane-outline" size={20} color="#045D91" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter flight number"
                placeholderTextColor={'grey'}
                value={newEventFlightNumber}
                onChangeText={setNewEventFlightNumber}
              />
            </View>

            <Text style={styles.label}>Aircraft Type</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="airplane-outline" size={20} color="#045D91" style={styles.inputIcon} />
              <RNPickerSelect
                onValueChange={value => {
                  setNewEventAircraftType(value)
                }}
                items={aircraftTypeData}
                style={{
                  ...pickerSelectStyles,
                  inputIOS: {
                    ...pickerSelectStyles.inputIOS,
                    paddingRight: 30 // to ensure the text is never behind the icon
                  },
                  inputAndroid: {
                    ...pickerSelectStyles.inputAndroid,
                    paddingRight: 30 // to ensure the text is never behind the icon
                  },
                  placeholder: {
                    ...pickerSelectStyles.placeholder,
                    paddingLeft: 0 // Adjust to match the padding left of the input
                  }
                }}
                value={newEventAircraftType}
                placeholder={{ label: 'Select aircraft type', value: null }}
                useNativeAndroidPickerStyle={false} // to use the custom styles on Android
              />
            </View>
            <Text style={styles.label}>Notes</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="clipboard-outline" size={20} color="#045D91" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Notes"
                placeholderTextColor={'grey'}
                value={newEventNotes}
                onChangeText={setNewEventNotes}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  clearInputs()
                  clearOriginAndDestination()
                  setModalVisible(false)
                }}
              >
                <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.addButton]} onPress={handleAddEvent}>
                <Text style={styles.buttonText}>{editMode ? 'Update' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 18,
    paddingHorizontal: 0,
    borderWidth: 0, // No border for the inner input
    color: 'black',
    flex: 1,
    height: '100%', // Ensure it matches the height of the input wrapper
    justifyContent: 'center' // Vertically center the text
    // paddingLeft: 0 // Adjust to match the icon
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0, // No border for the inner input
    color: 'black',
    flex: 1,
    height: '100%', // Ensure it matches the height of the input wrapper
    justifyContent: 'center' // Vertically center the text
  },
  placeholder: {
    color: 'grey' // Align the placeholder text with the input text
    // paddingLeft: 0 // Ensure the placeholder text aligns with the input text
  }
})

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f3f3'
  },
  sectionHeader: {
    backgroundColor: '#045D91',
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 10,
    marginVertical: 5,
    elevation: 3
  },
  sectionHeaderText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18
  },
  eventItem: {
    padding: 20,
    marginHorizontal: 10,
    marginVertical: 8,
    borderRadius: 10,
    elevation: 3,
    backgroundColor: 'white'
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  eventFlightNumber: {
    fontSize: 22, // Larger text size
    fontWeight: 'bold',
    color: '#045D91'
  },
  eventActions: {
    flexDirection: 'row'
  },
  eventBody: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  eventText: {
    marginLeft: 10,
    color: '#333',
    fontSize: 18, // Larger text size
    lineHeight: 24
  },
  importantText: {
    fontWeight: 'bold',
    color: '#000'
  },
  editButton: {
    marginLeft: 10
  },
  deleteButton: {
    marginLeft: 10
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalView: {
    marginTop: 100,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  scrollViewContent: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 10
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  modalText: {
    marginLeft: 10,
    fontSize: 20,
    fontWeight: 'bold'
  },
  clearButton: {
    marginLeft: 'auto',
    padding: 5
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    alignSelf: 'stretch',
    marginTop: 10,
    marginBottom: 20
  },
  label: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    fontSize: 17,
    fontWeight: '600',
    color: '#333'
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 40,
    borderColor: '#045D91',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 20,
    backgroundColor: 'white',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,

    elevation: 5
  },
  icon: {
    marginRight: 10
  },
  inputIcon: {
    marginRight: 10
  },
  input: {
    flex: 1,
    height: '100%',
    color: 'black',
    fontSize: 16
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    marginBottom: 10,
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
  buttonText: {
    marginLeft: 5,
    fontWeight: 'bold',
    color: 'white',
    fontSize: 16
  },
  cancelButton: {
    backgroundColor: 'white',
    borderColor: 'grey',
    borderWidth: 1
  },
  cancelButtonText: {
    color: 'grey'
  },
  addButton: {
    backgroundColor: '#045D91'
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderColor: '#045D91',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 20,
    backgroundColor: 'white',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,

    elevation: 5
  },
  dateText: {
    color: 'black',
    fontSize: 16
  },
  disabledButton: {
    backgroundColor: '#ccc',
    borderColor: '#999'
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  }
})

export default Roster
