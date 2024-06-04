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
import { Dropdown } from 'react-native-element-dropdown'
import AirportSearch from '@/components/airport-search'
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
    fetchRosterEntries(today, 5) // Fetch entries for the next 5 months
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

  const fetchRosterEntries = async (startDate, monthsSpan) => {
    const userId = await SecureStore.getItemAsync('userId')
    const start = moment(startDate).startOf('day')
    const end = moment(startDate).add(monthsSpan, 'months').endOf('day')

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

      console.log(rosterEntries)
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
    return moment(time).tz(timezone).format('YYYY-MM-DD HH:mm:ss')
  }

  const handleDeleteEvent = async eventId => {
    try {
      await axios.delete(`https://b113-103-18-0-17.ngrok-free.app/api/roster/deleteRosterEntry/${eventId}`)
      const today = getCurrentDate()
      await fetchRosterEntries(today, 5) // Refresh the entries
    } catch (error) {
      console.error('Error deleting event:', error)
    }
  }

  const renderEventItem = ({ item, index }) => (
    <View style={[styles.eventItem, { backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9' }]}>
      <View style={styles.eventHeader}>
        <Text style={styles.eventFlightNumber}>{item.flightNumber}</Text>
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
          <Ionicons name="airplane-outline" size={18} color="#045D91" />
          <Text style={styles.eventText}>{item.aircraftType.Model}</Text>
        </View>
        <View style={styles.eventRow}>
          <Ionicons name="location-outline" size={18} color="#045D91" />
          <Text style={styles.eventText}>
            {item.origin.name} ({item.origin.city}, {item.origin.country}) ➔ {item.destination.name} (
            {item.destination.city}, {item.destination.country})
          </Text>
        </View>
        <View style={styles.eventRow}>
          <Ionicons name="time-outline" size={18} color="#045D91" />
          <Text style={styles.eventText}>
            {getLocalTime(item.departureTime, item.origin.tz_database)} -{' '}
            {getLocalTime(item.arrivalTime, item.destination.tz_database)}
          </Text>
        </View>
        <View style={styles.eventRow}>
          <Ionicons name="clipboard-outline" size={18} color="#045D91" />
          <Text style={styles.eventText}>{item.notes}</Text>
        </View>
      </View>
    </View>
  )

  const handleEditEvent = event => {
    setEditMode(true)
    setEditEventId(event._id)
    setNewEventTitle(event.type)
    setNewEventOrigin(event.origin)
    setNewEventDestination(event.destination)
    setNewEventDepartureTime(event.departureTime)
    setNewEventArrivalTime(event.arrivalTime)
    setNewEventFlightNumber(event.flightNumber)
    setNewEventAircraftType(event.aircraftType.value)
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
        const response = await axios.put(
          `https://b113-103-18-0-17.ngrok-free.app/api/roster/updateRosterEntry/${editEventId}`,
          newEvent
        )
      } else {
        // Create new event
        const response = await axios.post(
          'https://b113-103-18-0-17.ngrok-free.app/api/roster/createRosterEntry',
          newEvent
        )
      }

      clearInputs()
      clearOriginAndDestination()
      setModalVisible(false)
      // Fetch roster entries again
      const today = getCurrentDate()
      await fetchRosterEntries(today, 5) // Fetch entries for the next 5 months
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
    const formattedDepartureDate = moment(date).tz(originTimezone).toISOString()

    if (newEventArrivalTime) {
      const formattedArrivalDate = moment(newEventArrivalTime).toISOString()

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
    const formattedArrivalDate = moment(date).tz(destinationTimezone).toISOString()

    if (newEventDepartureTime) {
      const formattedDepartureDate = moment(newEventDepartureTime).toISOString()

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
                [selectedDate]: { selected: true, marked: true, selectedColor: '#F04D23' }
              }}
              horizontal
              pagingEnabled
              showScrollIndicator={false}
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
              <TouchableOpacity onPress={confirmClearInputs} style={styles.clearButton}>
                <Ionicons name="trash-outline" size={24} color="red" />
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <Text style={styles.label}>Duty Type</Text>
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              inputSearchStyle={styles.inputSearchStyle}
              iconStyle={styles.iconStyle}
              data={DUTY_TYPES}
              search
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder="Select duty type"
              searchPlaceholder="Search..."
              value={newEventTitle}
              onChange={item => {
                setNewEventTitle(item.value)
                setNewEventDepartureTime('')
                setNewEventArrivalTime('')
              }}
              renderLeftIcon={() => <Ionicons style={styles.icon} color="#045D91" name="briefcase-outline" size={20} />}
            />

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
                  ? `${new Date(newEventDepartureTime).toLocaleDateString()} ${new Date(newEventDepartureTime)
                      .toLocaleTimeString()
                      .slice(0, 5)}`
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
                  ? `${new Date(newEventArrivalTime).toLocaleDateString()} ${new Date(newEventArrivalTime)
                      .toLocaleTimeString()
                      .slice(0, 5)}`
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
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              inputSearchStyle={styles.inputSearchStyle}
              iconStyle={styles.iconStyle}
              data={aircraftTypeData}
              search
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder="Select aircraft type"
              searchPlaceholder="Search..."
              value={newEventAircraftType}
              onChange={item => setNewEventAircraftType(item.value)}
              renderLeftIcon={() => <Ionicons style={styles.icon} color="#045D91" name="airplane-outline" size={20} />}
            />

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
    fontSize: 18,
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
    color: 'grey',
    fontSize: 16
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
  dropdown: {
    width: '100%',
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    borderColor: '#045D91',
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
  placeholderStyle: {
    color: 'grey',
    fontSize: 16
  },
  selectedTextStyle: {
    fontSize: 16
  },
  inputSearchStyle: {
    fontSize: 16
  },
  iconStyle: {
    fontSize: 16
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
  editButton: {
    marginLeft: 10
  },
  deleteButton: {
    marginLeft: 10
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  }
})

export default Roster
