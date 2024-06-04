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
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
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
      }
      navigation.setParams({ action: null }) // Reset action
    }
  }, [route.params])

  useEffect(() => {
    const today = getCurrentDate()
    setSelectedDate(today)
    handleDayPress({ dateString: today })
  }, [])

  useEffect(() => {
    fetchAircraftTypes()
      .then(data => {
        console.log(data)
        setAircraftTypeData(data)
      })
      .catch(error => {
        console.error('Error fetching aircraft types:', error)
      })
  }, [])

  const handleDayPress = day => {
    setSelectedDate(day.dateString)
    const eventsForDate = {
      '2024-06-01': [{ id: '1', title: 'Meeting with Team' }],
      '2024-06-02': [
        { id: '2', title: 'Project Deadline' },
        { id: '3', title: 'Project Deadline' },
        { id: '4', title: 'Project Deadline' },
        { id: '5', title: 'Project Deadline' }
      ]
    }
    setEvents(eventsForDate[day.dateString] || [])
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

  const renderEventItem = ({ item, index }) => (
    <View style={[styles.eventItem, { backgroundColor: index % 2 === 0 ? '#D8F3FF' : '#EFFAFF' }]}>
      <Text>{item.title}</Text>
    </View>
  )

  const handleAddEvent = async () => {
    if (!newEventTitle) {
      console.error('Event title is required')
      return
    }

    // Fetch user ID from Secure Store
    const userId = await SecureStore.getItemAsync('userId')
    const newEvent = {
      userId,
      type: newEventTitle,
      origin: newEventOrigin?.value, // Assuming newEventOrigin has a 'value' property storing the ObjectId
      destination: newEventDestination?.value,
      departureTime: newEventDepartureTime,
      arrivalTime: newEventArrivalTime,
      flightNumber: newEventFlightNumber,
      aircraftType: newEventAircraftType,
      notes: newEventNotes
    }

    try {
      console.log(newEvent)
      const response = await axios.post(
        'https://b113-103-18-0-17.ngrok-free.app/api/roster/createRosterEntry',
        newEvent
      )
      console.log('New event added:', response.data)
      setEvents([...events, response.data])
      clearInputs()
      clearOriginAndDestination()
      setModalVisible(false)
    } catch (error) {
      console.error('Error adding new event:', error)
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
    console.log(result)
    if (result.type === 'success') {
      setDocument(result)
      console.log(result)
    }
  }

  const handleConfirmDeparture = date => {
    if (!newEventOrigin) {
      Alert.alert('Select origin first!')
      return
    }

    const originTimezone = newEventOrigin.timezone
    const formattedDepartureDate = moment(date).tz(originTimezone).toISOString()
    console.log(formattedDepartureDate)

    // Ensure arrival time has been set and is not before the new departure time
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
    console.log(formattedArrivalDate)

    // Ensure departure time has been set and is not after the new arrival time
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
        keyExtractor={(item, index) => item.id}
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
              <Ionicons name="add-circle" size={24} color="#045D91" />
              <Text style={styles.modalText}>Add Roster Entry</Text>
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
                // Reset times when duty type changes
                setNewEventDepartureTime('')
                setNewEventArrivalTime('')
              }}
              renderLeftIcon={() => <Ionicons style={styles.icon} color="#045D91" name="briefcase-outline" size={20} />}
            />

            <Text style={styles.label}>Origin</Text>
            <AirportSearch ref={originRef} placeholder="Enter origin" onSelect={handleSelectOrigin} />
            <Text style={styles.label}>Destination</Text>
            <AirportSearch ref={destinationRef} placeholder="Enter destination" onSelect={handleSelectDestination} />
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
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.addButton]} onPress={handleAddEvent}>
                <Text style={styles.buttonText}>Add</Text>
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
    flex: 1
  },
  sectionHeader: {
    backgroundColor: '#f3f3f3',
    padding: 10
  },
  sectionHeaderText: {
    fontWeight: 'bold'
  },
  eventItem: {
    height: 100,
    width: '95%',
    padding: 10,
    marginHorizontal: 10,
    marginVertical: 4,
    borderRadius: 10
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
    marginBottom: 5
  },
  modalText: {
    marginLeft: 10,
    fontSize: 18,
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
    marginBottom: 5,
    fontSize: 15,
    fontWeight: '600',
    color: 'grey'
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
    fontSize: 14
  },
  selectedTextStyle: {
    fontSize: 14
  },
  inputSearchStyle: {
    fontSize: 14
  },
  iconStyle: {
    fontSize: 14
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
    color: 'black'
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
    color: 'white'
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
    textColor: 'black',
    fontSize: 14
  },
  disabledButton: {
    backgroundColor: '#ccc',
    borderColor: '#999'
  }
})

export default Roster
