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
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native'
import {
  addRosterEntry,
  getAllRosterEntries,
  updateRosterEntry,
  deleteRosterEntry,
  getAircraftsFromDatabase
} from '../../services/utils/database'
import React, { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { fetchAircraftTypes } from '../../services/apis/aircraft-api'
import AsyncStorage from '@react-native-async-storage/async-storage'
import DateTimePickerModal from 'react-native-modal-datetime-picker'
import { useNavigation, useRoute } from '@react-navigation/native'
import AirportSearch from '@/components/airport-search'
import RNPickerSelect from 'react-native-picker-select'
import * as DocumentPicker from 'expo-document-picker'
import NetInfo from '@react-native-community/netinfo'
import { CalendarList } from 'react-native-calendars'
import { DUTY_TYPES } from '../../constants/duties'
import * as Notifications from 'expo-notifications'
import * as SecureStore from 'expo-secure-store'
import { Ionicons } from '@expo/vector-icons'
import Toast from '@/components/toast'
import uuid from 'react-native-uuid'
import moment from 'moment-timezone'
import axios from 'axios'

// Constants for keys used to store settings
const NOTIFICATIONS_ENABLED_KEY = 'notificationsEnabled'
const CUSTOM_REMINDER_HOUR_KEY = 'customReminderHour'
const REST_REMINDER_ENABLED_KEY = 'restReminderEnabled'
const RED_EYE_REMINDER_TIME_KEY = 'redEyeReminderTime'

const Roster = () => {
  const [selectedDate, setSelectedDate] = useState('')
  const [events, setEvents] = useState([])
  const [modalVisible, setModalVisible] = useState(false)
  const [newEventTitle, setNewEventTitle] = useState(null)
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
  const [loading, setLoading] = useState(false)
  const [uploadedRosterData, setUploadedRosterData] = useState([])
  const [showRosterModal, setShowRosterModal] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [uploadingRoster, setUploadingRoster] = useState(false)
  const [selectedEntryIndex, setSelectedEntryIndex] = useState(null)
  const [homebaseTZ, setHomebaseTZ] = useState('')

  const [toastVisible, setToastVisible] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [customReminderHour, setCustomReminderHour] = useState(2) // Default to 2 hours before the event
  const [restReminderEnabled, setRestReminderEnabled] = useState(false) // For rest reminders
  const [redEyeReminderTime, setRedEyeReminderTime] = useState(18) // Default red-eye reminder time (6 PM)

  const originRef = useRef(null)
  const destinationRef = useRef(null)
  const navigation = useNavigation()
  const route = useRoute()

  const DISPLAY_FORMAT = 'DD/MM/YYYY HH:mm [GMT]Z'

  // Load saved settings from AsyncStorage
  const loadSettings = async () => {
    try {
      const savedNotificationsEnabled = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY)
      const savedCustomReminderHour = await AsyncStorage.getItem(CUSTOM_REMINDER_HOUR_KEY)
      const savedRestReminderEnabled = await AsyncStorage.getItem(REST_REMINDER_ENABLED_KEY)
      const savedRedEyeReminderTime = await AsyncStorage.getItem(RED_EYE_REMINDER_TIME_KEY)

      if (savedNotificationsEnabled !== null) {
        setNotificationsEnabled(JSON.parse(savedNotificationsEnabled))
      }
      if (savedCustomReminderHour !== null) {
        setCustomReminderHour(JSON.parse(savedCustomReminderHour))
      }
      if (savedRestReminderEnabled !== null) {
        setRestReminderEnabled(JSON.parse(savedRestReminderEnabled))
      }
      if (savedRedEyeReminderTime !== null) {
        setRedEyeReminderTime(JSON.parse(savedRedEyeReminderTime))
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

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
      navigation.setParams({ action: null })
    }
  }, [route.params])

  useEffect(() => {
    loadSettings() // Load settings when the component mounts

    const today = getCurrentDate()
    setSelectedDate(today)
    fetchRosterEntries(today)
  }, [])

  useEffect(() => {
    const fetchAircrafts = async () => {
      try {
        const data = await getAircraftsFromDatabase()
        setAircraftTypeData(data)
      } catch (error) {
        console.error('Error fetching aircraft data from SQLite:', error)
      }
    }
    fetchAircrafts()
  }, [])

  useEffect(() => {
    const generateMarkedDates = () => {
      const dates = {}
      Object.keys(rosterEntries).forEach(date => {
        dates[date] = {
          marked: true,
          dotColor: '#50cebb',
          activeOpacity: 0
        }
      })
      return dates
    }

    const markedDates = generateMarkedDates()
    setMarkedDates(markedDates)
  }, [rosterEntries])

  useEffect(() => {
    const scheduleAllNotifications = async () => {
      await cancelAllNotifications()

      events.forEach(event => {
        if (notificationsEnabled) {
          scheduleNotification(event, customReminderHour)

          const eventTime = moment.tz(event.departureTime, event.origin?.tz_database || homebaseTZ)
          const departureHour = eventTime.hour()

          if (departureHour >= 0 && departureHour <= 7) {
            scheduleRedEyeReminder(event, redEyeReminderTime)
          }
        }
      })
    }

    scheduleAllNotifications()
  }, [notificationsEnabled, customReminderHour, redEyeReminderTime, events])

  useEffect(() => {
    const fetchHomebaseTZ = async () => {
      try {
        const tz = await SecureStore.getItemAsync('homebaseTZDatabase')
        if (tz) setHomebaseTZ(tz)
      } catch (error) {
        console.error('Error fetching home base timezone:', error)
      }
    }

    fetchHomebaseTZ()
  }, [])

  const cancelAllNotifications = async () => {
    await Notifications.cancelAllScheduledNotificationsAsync()
  }

  const requestNotificationPermission = async () => {
    return (await Notifications.requestPermissionsAsync()).status === 'granted'
  }

  const fetchRosterEntries = async startDate => {
    try {
      const offlineEntries = await getAllRosterEntries()
      const processedOfflineEntries = processEntries(offlineEntries)

      setRosterEntries(processedOfflineEntries)
      setEvents(processedOfflineEntries[startDate] || [])
    } catch (error) {
      console.error('Error fetching offline roster entries:', error)
    }
  }

  const processEntries = entries => {
    return entries.reduce((acc, entry, index) => {
      try {
        const validDate = entry.departureTime || entry.createdAt

        if (!validDate) {
          console.warn(`Entry at index ${index} has no valid date.`, entry)
          return acc
        }

        const timezone = entry.origin?.tz_database || entry.destination?.tz_database || homebaseTZ || 'UTC'

        // if (['STANDBY', 'TRAINING', 'OFF_DUTY', 'MEDICAL_CHECK', 'MEETING'].includes(entry.type)) {
        //   console.info(`Entry at index ${index} uses default timezone (${timezone}) due to type: ${entry.type}`)
        // }

        const date = moment(validDate).tz(timezone)
        if (!date.isValid()) {
          console.warn(`Invalid moment date for entry at index ${index}:`, validDate)
          return acc
        }

        const formattedDate = date.format('YYYY-MM-DD')
        if (!acc[formattedDate]) acc[formattedDate] = []
        acc[formattedDate].push(entry)
      } catch (error) {
        console.error(`Error processing entry at index ${index}:`, error, entry)
      }

      return acc
    }, {})
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
    const resolvedTimezone = timezone || homebaseTZ
    return moment(time).tz(resolvedTimezone).format('DD/MM/YYYY HH:mm [GMT]Z')
  }

  const showToast = message => {
    setToastMessage(message)
    setToastVisible(true)
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
              const isConnected = false

              if (isConnected) {
              }

              await deleteRosterEntry(rosterId, isConnected)
              showToast('Roster entry deleted successfully.')

              const today = getCurrentDate()
              await fetchRosterEntries(today)
            } catch (error) {
              showToast('Failed to delete roster entry.')
              console.error('Error deleting event:', error)
            }
          }
        }
      ],
      { cancelable: true }
    )
  }

  const scheduleNotification = async (event, reminderHoursBefore) => {
    const permissionGranted = await requestNotificationPermission()
    if (!permissionGranted) return

    const timezone = event.origin?.tz_database || homebaseTZ
    const eventStartTime = event.departureTime ? moment.tz(event.departureTime, timezone) : null
    const eventEndTime = event.arrivalTime ? moment.tz(event.arrivalTime, timezone) : null

    // Common validation
    if (!eventStartTime || !eventStartTime.isValid()) {
      console.warn('Invalid or missing start time for event:', event)
      return
    }

    const reminderTime = eventStartTime.clone().subtract(reminderHoursBefore, 'hours')

    if (reminderTime.isAfter(moment())) {
      let notificationTitle = 'Upcoming Event Reminder'
      let notificationBody = ''

      // Notification configuration based on event type
      switch (event.type) {
        case 'STANDBY':
          notificationTitle = 'Standby Duty Reminder'
          notificationBody = `Your standby duty starts in ${reminderHoursBefore} hours.`
          break

        case 'TRAINING':
          notificationTitle = 'Training Reminder'
          notificationBody = `Your training session starts in ${reminderHoursBefore} hours.`
          break

        case 'OFF_DUTY':
          notificationTitle = 'Off Duty Reminder'
          notificationBody = `Enjoy your off-duty time! It begins in ${reminderHoursBefore} hours.`
          break

        case 'LAYOVER':
          notificationTitle = 'Layover Reminder'
          notificationBody = `Your layover at ${event.origin?.name} (${event.origin?.IATA}) starts in ${reminderHoursBefore} hours.`
          break

        case 'MEDICAL_CHECK':
          notificationTitle = 'Medical Check Reminder'
          notificationBody = `Your medical check starts in ${reminderHoursBefore} hours.`
          break

        case 'MEETING':
          notificationTitle = 'Meeting Reminder'
          notificationBody = `Your meeting starts in ${reminderHoursBefore} hours.`
          break

        case 'FLIGHT_DUTY':
          notificationTitle = `Flight Duty Reminder: ${event.flightNumber || 'N/A'}`
          notificationBody = `Your flight from ${event.origin?.IATA || 'N/A'} to ${event.destination?.IATA || 'N/A'} departs in ${reminderHoursBefore} hours.`
          break

        default:
          notificationTitle = 'Event Reminder'
          notificationBody = `You have an upcoming event starting in ${reminderHoursBefore} hours.`
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationTitle,
          body: notificationBody,
          sound: 'default',
          badge: 1
        },
        trigger: {
          date: new Date(reminderTime)
        }
      })
    }

    // Notification for end time, if applicable
    if (eventEndTime && eventEndTime.isAfter(moment())) {
      let endNotificationTitle = `${event.type} End Reminder`
      let endNotificationBody = `Your ${event.type.toLowerCase()} ends soon.`

      if (event.type === 'STANDBY') {
        endNotificationTitle = 'Standby Duty End Reminder'
        endNotificationBody = 'Your standby duty has ended.'
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: endNotificationTitle,
          body: endNotificationBody,
          sound: 'default',
          badge: 1
        },
        trigger: {
          date: new Date(eventEndTime)
        }
      })
    }
  }

  const scheduleRedEyeReminder = async (event, redEyeReminderTime) => {
    const permissionGranted = await requestNotificationPermission()
    if (!permissionGranted) return

    const eventTime = moment.tz(event.departureTime, event.origin?.tz_database || homebaseTZ)
    const departureHour = eventTime.hour()

    if (departureHour >= 0 && departureHour <= 7) {
      const reminderDayBefore = eventTime.clone().subtract(1, 'day').set('hour', redEyeReminderTime).set('minute', 0)

      if (reminderDayBefore.isAfter(moment())) {
        const formattedDepartureTime = eventTime.format('DD/MM/YYYY HH:mm [GMT]Z')

        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Red-Eye Flight Reminder: ${event.flightNumber}`,
            body: `You have a red-eye flight tomorrow from ${event.origin.IATA} to ${event.destination.IATA} departing at ${formattedDepartureTime}.`,
            sound: 'default',
            badge: 1
          },
          trigger: {
            date: new Date(reminderDayBefore)
          }
        })
      }
    }
  }

  const renderEventItem = ({ item, index }) => {
    return (
      <View style={[styles.eventItem, { backgroundColor: '#ffffff' }]}>
        <View style={styles.eventHeader}>
          <Text style={styles.eventFlightNumber}>
            {item.type === 'STANDBY' ? (
              `Standby: ${item.flightNumber || ''}`
            ) : item.type === 'TRAINING' ? (
              `Training`
            ) : item.type === 'OFF_DUTY' ? (
              `Off Duty`
            ) : item.type === 'LAYOVER' ? (
              `Layover (${item.origin.IATA}/${item.origin.ICAO})`
            ) : item.type === 'MEDICAL_CHECK' ? (
              `Medical Check`
            ) : item.type === 'MEETING' ? (
              `Meeting`
            ) : item.type === 'FLIGHT_DUTY' ? (
              <>
                {item.origin.IATA || 'N/A'} <Ionicons name="airplane-outline" size={20} color="#045D91" />{' '}
                {item.destination.IATA || 'N/A'} {item.flightNumber && `(${item.flightNumber})`}
              </>
            ) : (
              `${item.type || 'Event'}`
            )}
          </Text>
          <View style={styles.eventActions}>
            <TouchableOpacity style={styles.editButton} onPress={() => handleEditEvent(item)}>
              <Ionicons name="pencil-outline" size={20} color="#045D91" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteEvent(item.id)}>
              <Ionicons name="trash-outline" size={20} color="red" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.eventBody}>
          {item.type === 'STANDBY' ? (
            <>
              <View style={styles.eventRow}>
                <Ionicons name="time-outline" size={18} color="#045D91" />
                <Text style={[styles.eventText, styles.importantText]}>
                  Start: {getLocalTime(item.departureTime, homebaseTZ)}
                </Text>
              </View>
              <View style={styles.eventRow}>
                <Ionicons name="time-outline" size={18} color="#045D91" />
                <Text style={[styles.eventText, styles.importantText]}>
                  End: {getLocalTime(item.arrivalTime, homebaseTZ)}
                </Text>
              </View>
            </>
          ) : item.type === 'TRAINING' ? (
            <>
              <View style={styles.eventRow}>
                <Ionicons name="time-outline" size={18} color="#045D91" />
                <Text style={[styles.eventText, styles.importantText]}>
                  Start: {getLocalTime(item.departureTime, homebaseTZ)}
                </Text>
              </View>
              <View style={styles.eventRow}>
                <Ionicons name="time-outline" size={18} color="#045D91" />
                <Text style={[styles.eventText, styles.importantText]}>
                  End: {getLocalTime(item.arrivalTime, homebaseTZ)}
                </Text>
              </View>
              {item.notes && (
                <View style={styles.eventRow}>
                  <Ionicons name="clipboard-outline" size={18} color="#045D91" />
                  <Text style={styles.eventText}>Notes: {item.notes}</Text>
                </View>
              )}
            </>
          ) : item.type === 'OFF_DUTY' ? (
            <>
              <View style={styles.eventRow}>
                <Ionicons name="time-outline" size={18} color="#045D91" />
                <Text style={[styles.eventText, styles.importantText]}>
                  Start: {getLocalTime(item.departureTime, homebaseTZ)}
                </Text>
              </View>
              <View style={styles.eventRow}>
                <Ionicons name="time-outline" size={18} color="#045D91" />
                <Text style={[styles.eventText, styles.importantText]}>
                  End: {getLocalTime(item.arrivalTime, homebaseTZ)}
                </Text>
              </View>
              {item.notes && (
                <View style={styles.eventRow}>
                  <Ionicons name="clipboard-outline" size={18} color="#045D91" />
                  <Text style={styles.eventText}>Notes: {item.notes}</Text>
                </View>
              )}
            </>
          ) : item.type === 'LAYOVER' ? (
            <>
              <View style={styles.eventRow}>
                <Ionicons name="location-outline" size={18} color="#045D91" />
                <Text style={styles.eventText}>
                  Origin: {item.origin.name} ({item.origin.city}, {item.origin.country})
                </Text>
              </View>
              <View style={styles.eventRow}>
                <Ionicons name="time-outline" size={18} color="#045D91" />
                <Text style={[styles.eventText, styles.importantText]}>
                  Start: {getLocalTime(item.departureTime, homebaseTZ)}
                </Text>
              </View>
              <View style={styles.eventRow}>
                <Ionicons name="time-outline" size={18} color="#045D91" />
                <Text style={[styles.eventText, styles.importantText]}>
                  End: {getLocalTime(item.arrivalTime, homebaseTZ)}
                </Text>
              </View>
              {item.notes && (
                <View style={styles.eventRow}>
                  <Ionicons name="clipboard-outline" size={18} color="#045D91" />
                  <Text style={styles.eventText}>Notes: {item.notes}</Text>
                </View>
              )}
            </>
          ) : item.type === 'MEDICAL_CHECK' || item.type === 'MEETING' ? (
            <>
              <View style={styles.eventRow}>
                <Ionicons name="time-outline" size={18} color="#045D91" />
                <Text style={[styles.eventText, styles.importantText]}>
                  Start: {getLocalTime(item.departureTime, homebaseTZ)}
                </Text>
              </View>
              <View style={styles.eventRow}>
                <Ionicons name="time-outline" size={18} color="#045D91" />
                <Text style={[styles.eventText, styles.importantText]}>
                  End: {getLocalTime(item.arrivalTime, homebaseTZ)}
                </Text>
              </View>
              {item.notes && (
                <View style={styles.eventRow}>
                  <Ionicons name="clipboard-outline" size={18} color="#045D91" />
                  <Text style={styles.eventText}>Notes: {item.notes}</Text>
                </View>
              )}
            </>
          ) : item.type === 'FLIGHT_DUTY' ? (
            <>
              <View style={styles.eventRow}>
                <Ionicons name="time-outline" size={18} color="#045D91" />
                <Text style={[styles.eventText, styles.importantText]}>
                  Departure: {getLocalTime(item.departureTime, item.origin?.tz_database || homebaseTZ)}
                </Text>
              </View>
              <View style={styles.eventRow}>
                <Ionicons name="time-outline" size={18} color="#045D91" />
                <Text style={[styles.eventText, styles.importantText]}>
                  Arrival: {getLocalTime(item.arrivalTime, item.destination?.tz_database || homebaseTZ)}
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
              {item.aircraftType?.model && (
                <View style={styles.eventRow}>
                  <Ionicons name="airplane-outline" size={18} color="#045D91" />
                  <Text style={styles.eventText}>Aircraft: {item.aircraftType.model}</Text>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.eventText}>This event type is not explicitly handled yet.</Text>
          )}
        </View>
      </View>
    )
  }

  const handleEditEvent = event => {
    setEditMode(true)
    setEditEventId(event._id || event.id)
    setNewEventTitle(event.type)

    setNewEventOrigin(
      event.origin.objectId
        ? {
            value: event.origin.objectId,
            label: `(${event.origin.IATA}/${event.origin.ICAO}) - ${event.origin.name}`,
            timezone: event.origin.tz_database
          }
        : ''
    )

    setNewEventDestination(
      event.destination.objectId
        ? {
            value: event.destination.objectId,
            label: `(${event.destination.IATA}/${event.destination.ICAO}) - ${event.destination.name}`,
            timezone: event.destination.tz_database
          }
        : ''
    )

    setNewEventDepartureTime(
      event.departureTime ? formatTimeWithGMT(event.departureTime, event.origin?.tz_database || homebaseTZ) : ''
    )

    setNewEventArrivalTime(
      event.arrivalTime ? formatTimeWithGMT(event.arrivalTime, event.destination?.tz_database || homebaseTZ) : ''
    )

    setNewEventFlightNumber(event.flightNumber || '')

    setNewEventAircraftType(event.aircraftType ? event.aircraftType._id : '')

    setNewEventNotes(event.notes || '')

    setModalVisible(true)
  }

  const handleAddEvent = async () => {
    if (!newEventTitle) {
      Alert.alert('Validation Error', 'Duty type is required')
      return
    }

    // Only check for origin when required
    if (!['STANDBY', 'TRAINING', 'OFF_DUTY', 'MEDICAL_CHECK', 'MEETING'].includes(newEventTitle) && !newEventOrigin) {
      Alert.alert('Validation Error', 'Origin is required')
      return
    }

    // Check for required fields for standby
    if (newEventTitle === 'STANDBY' && (!newEventDepartureTime || !newEventArrivalTime)) {
      Alert.alert('Validation Error', 'Start and end times are required for standby duty.')
      return
    }

    // Check for destination when required
    if (
      !['STANDBY', 'TRAINING', 'OFF_DUTY', 'LAYOVER', 'MEDICAL_CHECK', 'MEETING'].includes(newEventTitle) &&
      !newEventDestination
    ) {
      Alert.alert('Validation Error', 'Destination is required')
      return
    }

    if (!newEventDepartureTime) {
      Alert.alert('Validation Error', 'Start time is required')
      return
    }

    if (!['STANDBY', 'TRAINING', 'OFF_DUTY'].includes(newEventTitle) && !newEventArrivalTime) {
      Alert.alert('Validation Error', 'Arrival time is required')
      return
    }

    const timezone = newEventOrigin?.timezone || homebaseTZ
    const departureDateTime = moment.tz(newEventDepartureTime, DISPLAY_FORMAT, timezone)
    const arrivalDateTime = newEventArrivalTime
      ? moment.tz(newEventArrivalTime, DISPLAY_FORMAT, newEventDestination?.timezone || timezone)
      : null

    if (newEventArrivalTime && departureDateTime.isAfter(arrivalDateTime)) {
      Alert.alert('Validation Error', 'Departure time cannot be later than arrival time')
      return
    }

    setLoading(true)

    const userId = await SecureStore.getItemAsync('userId')
    const formattedDepartureTime = departureDateTime.toISOString()
    const formattedArrivalTime = arrivalDateTime?.toISOString()

    const eventEntry = {
      userId,
      type: newEventTitle,
      origin: newEventOrigin?.value,
      destination: newEventDestination?.value,
      departureTime: formattedDepartureTime,
      arrivalTime: formattedArrivalTime,
      flightNumber: newEventFlightNumber,
      aircraftType: newEventAircraftType || null,
      notes: newEventNotes || '',
      synced: 0,
      id: uuid.v4()
    }

    try {
      if (editMode) {
        await updateRosterEntry(editEventId, eventEntry)
      } else {
        await addRosterEntry(eventEntry)
      }

      clearInputs()
      clearOriginAndDestination()
      setModalVisible(false)
    } catch (error) {
      console.error('Error saving event:', error)
      Alert.alert('Error', 'Could not save the event. Please try again.')
    } finally {
      setLoading(false)
      await fetchRosterEntries(getCurrentDate())
    }
  }

  const handleSelectOrigin = airport => {
    setNewEventOrigin(airport)
    setNewEventDepartureTime('')
    setNewEventArrivalTime('')
  }

  const handleSelectDestination = airport => {
    setNewEventDestination(airport)
    setNewEventArrivalTime('')
  }

  const handlePickDocument = async () => {
    const userId = await SecureStore.getItemAsync('userId')

    const response = await axios.get(`https://40c7-115-164-76-186.ngrok-free.app/api/airline/${userId}/canUploadRoster`)

    if (!response.data || !response.data.canUploadRoster) {
      Alert.alert('Roster Import Not Supported', 'We have yet to support roster imports for your airline.')
      return
    }

    let result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf']
    })
    if (result.assets && result.assets.length > 0) {
      const file = result.assets[0]
      setUploadingRoster(true)
      setLoading(true)

      try {
        const formData = new FormData()
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType
        })

        const response = await axios.post('https://40c7-115-164-76-186.ngrok-free.app/api/pdf/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })

        if (response.data.parsedData) {
          setUploadedRosterData(response.data.parsedData)
          setShowRosterModal(true)
        } else {
          Alert.alert('Error', 'Unable to parse the uploaded roster.')
        }
      } catch (error) {
        console.error('Error uploading file:', error)
        Alert.alert('Error', 'Error uploading file')
      } finally {
        setUploadingRoster(false)
        setLoading(false)
      }
    }
  }

  const handleSaveUploadedRoster = async () => {
    const incompleteEntries = uploadedRosterData.filter(entry => !entry.selectedDate)
    if (incompleteEntries.length > 0) {
      Alert.alert('Validation Error', 'Please select a date for all roster entries before saving.')
      return
    }

    setLoading(true)

    try {
      const userId = await SecureStore.getItemAsync('userId')
      const processedEntries = uploadedRosterData.map(entry => {
        const selectedDate = moment(entry.selectedDate).format('YYYY-MM-DD')

        const flightNumber = entry.type === 'STANDBY' ? entry.standby : entry.flightNumber || ''

        const startTime = entry.startTime
          ? moment.tz(`${selectedDate} ${entry.startTime}`, 'YYYY-MM-DD HH:mm', homebaseTZ).toISOString()
          : null

        const endTime = entry.endTime
          ? moment.tz(`${selectedDate} ${entry.endTime}`, 'YYYY-MM-DD HH:mm', homebaseTZ).toISOString()
          : null

        const departureTime =
          entry.type === 'STANDBY'
            ? startTime
            : entry.departureTime
              ? moment
                  .tz(
                    `${selectedDate} ${entry.departureTime}`,
                    'YYYY-MM-DD HH:mm',
                    entry.departureAirport?.tz_database || homebaseTZ
                  )
                  .toISOString()
              : null

        const arrivalTime =
          entry.type === 'STANDBY'
            ? endTime
            : entry.arrivalTime
              ? moment
                  .tz(
                    `${selectedDate} ${entry.arrivalTime}`,
                    'YYYY-MM-DD HH:mm',
                    entry.arrivalAirport?.tz_database || homebaseTZ
                  )
                  .toISOString()
              : null

        return {
          id: uuid.v4(),
          userId,
          type: entry.type || 'STANDBY',
          origin: entry.type === 'STANDBY' ? null : entry.departureAirport?.objectId || null,
          destination: entry.type === 'STANDBY' ? null : entry.arrivalAirport?.objectId || null,
          departureTime,
          arrivalTime,
          flightNumber,
          startTime,
          endTime,
          notes: entry.notes || '',
          synced: 0
        }
      })

      for (const entry of processedEntries) {
        await addRosterEntry(entry)
      }

      setUploadedRosterData([])
      setShowRosterModal(false)
      Alert.alert('Success', 'All roster entries have been saved successfully.')
    } catch (error) {
      console.error('Error saving uploaded roster entries:', error)
      Alert.alert('Error', 'An error occurred while saving the roster entries. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmDeparture = date => {
    const timezone = newEventOrigin?.timezone || homebaseTZ
    const displayDepartureDate = moment(date).format('YYYY-MM-DDTHH:mm:ss')
    const convertedDepartureDate = moment.tz(displayDepartureDate, timezone).format(DISPLAY_FORMAT)

    if (newEventArrivalTime) {
      const arrivalDateTime = moment.tz(
        newEventArrivalTime,
        DISPLAY_FORMAT,
        newEventDestination?.timezone || homebaseTZ
      )
      const departureDateTime = moment.tz(convertedDepartureDate, DISPLAY_FORMAT, timezone)

      if (departureDateTime.isAfter(arrivalDateTime)) {
        Alert.alert('Error', 'Departure time cannot be later than the arrival time.')
        return
      }
    }

    setNewEventDepartureTime(convertedDepartureDate)
    setDeparturePickerVisible(false)
  }

  const handleConfirmArrival = date => {
    const timezone = newEventDestination?.timezone || newEventOrigin?.timezone || homebaseTZ
    const displayArrivalDate = moment(date).format('YYYY-MM-DDTHH:mm:ss')
    const convertedArrivalDate = moment.tz(displayArrivalDate, timezone).format(DISPLAY_FORMAT)

    if (newEventDepartureTime) {
      const departureDateTime = moment.tz(newEventDepartureTime, DISPLAY_FORMAT, newEventOrigin?.timezone || homebaseTZ)
      const arrivalDateTime = moment.tz(convertedArrivalDate, DISPLAY_FORMAT, timezone)

      if (arrivalDateTime.isBefore(departureDateTime)) {
        Alert.alert('Error', 'Arrival time cannot be earlier than the departure time.')
        return
      }
    }

    setNewEventArrivalTime(convertedArrivalDate)
    setArrivalPickerVisible(false)
  }

  const formatTimeWithGMT = (time, timezone) => {
    return moment(time).tz(timezone).format(DISPLAY_FORMAT)
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

  const handleDateChange = (date, index) => {
    const updatedData = [...uploadedRosterData]
    updatedData[index].selectedDate = date
    setUploadedRosterData(updatedData)
  }

  const handleDutyTypeChange = value => {
    setNewEventTitle(value)

    if (['MEDICAL_CHECK', 'MEETING'].includes(value)) {
      // Medical and Meeting: Show only Start Time, End Time, and Notes
      setNewEventOrigin(null)
      setNewEventDestination(null)
      setNewEventFlightNumber('')
      setNewEventAircraftType('')
    } else if (value === 'LAYOVER') {
      // Layover: Show Origin (required), Start Time, End Time, and Notes
      setNewEventDestination(null)
      setNewEventFlightNumber('')
      setNewEventAircraftType('')
    } else if (value === 'OFF_DUTY') {
      // Off Duty: Show only Start Time, End Time, and Notes
      setNewEventOrigin(null)
      setNewEventDestination(null)
      setNewEventFlightNumber('')
      setNewEventAircraftType('')
    } else if (value === 'STANDBY') {
      // Standby: Show Start Time, End Time, Standby Number, and Notes
      setNewEventOrigin(null)
      setNewEventDestination(null)
      setNewEventAircraftType('')
    } else if (value === 'TRAINING') {
      // Training: Show Start Time, End Time, and Notes
      setNewEventOrigin(null)
      setNewEventDestination(null)
      setNewEventFlightNumber('')
      setNewEventAircraftType('')
    } else {
      // Default for Flight Duty and other types
      setNewEventOrigin(null)
      setNewEventDestination(null)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <SectionList
        sections={[{ title: selectedDate ? getFormattedDate(selectedDate) : '', data: events }]}
        keyExtractor={(item, index) => item.id} //_id for online
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
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.modalView}>
            <ScrollView contentContainerStyle={styles.scrollViewContent}>
              {/* Modal Header */}
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

              {/* Duty Type Selection */}
              <Text style={styles.label}>Duty Type</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="briefcase-outline" size={20} color="#045D91" style={styles.inputIcon} />
                <RNPickerSelect
                  onValueChange={handleDutyTypeChange}
                  items={DUTY_TYPES.map(duty => ({ label: duty.label, value: duty.value }))}
                  style={{
                    ...pickerSelectStyles,
                    inputIOS: { ...pickerSelectStyles.inputIOS, paddingRight: 30 },
                    inputAndroid: { ...pickerSelectStyles.inputAndroid, paddingRight: 30 },
                    placeholder: { ...pickerSelectStyles.placeholder, paddingLeft: 0 }
                  }}
                  value={newEventTitle}
                  placeholder={{ label: 'Select duty type', value: null }}
                  useNativeAndroidPickerStyle={false}
                />
              </View>

              {/* Render Additional Fields After Duty Type Selection */}
              {newEventTitle && (
                <>
                  {['FLIGHT_DUTY', 'LAYOVER'].includes(newEventTitle) && (
                    <>
                      <Text style={styles.label}>Origin</Text>
                      <AirportSearch
                        ref={originRef}
                        placeholder="Enter origin"
                        initialValue={newEventOrigin}
                        onSelect={handleSelectOrigin}
                      />
                    </>
                  )}

                  {newEventTitle === 'STANDBY' && (
                    <>
                      <Text style={styles.label}>Origin (Optional)</Text>
                      <AirportSearch
                        ref={originRef}
                        placeholder="Enter origin (optional)"
                        initialValue={newEventOrigin}
                        onSelect={handleSelectOrigin}
                      />
                    </>
                  )}

                  {newEventTitle === 'FLIGHT_DUTY' && (
                    <>
                      <Text style={styles.label}>Destination</Text>
                      <AirportSearch
                        ref={destinationRef}
                        placeholder="Enter destination"
                        initialValue={newEventDestination}
                        onSelect={handleSelectDestination}
                      />
                    </>
                  )}

                  {/* Departure Time (previously Start Time) */}
                  <Text style={styles.label}>
                    {newEventTitle === 'FLIGHT_DUTY' ? 'Departure Time (local time)' : 'Start Time (local time)'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      if (newEventTitle !== 'FLIGHT_DUTY' || (newEventOrigin && newEventDestination)) {
                        setDeparturePickerVisible(true)
                      }
                    }}
                    style={[
                      styles.datePicker,
                      newEventTitle === 'FLIGHT_DUTY' && (!newEventOrigin || !newEventDestination)
                        ? { backgroundColor: '#f0f0f0' } // Disabled style
                        : {}
                    ]}
                    disabled={newEventTitle === 'FLIGHT_DUTY' && (!newEventOrigin || !newEventDestination)}
                  >
                    <Ionicons name="time-outline" size={20} color="#045D91" style={styles.inputIcon} />
                    <Text style={[styles.dateText, newEventDepartureTime ? {} : { color: 'grey' }]}>
                      {newEventDepartureTime ||
                        (newEventTitle === 'FLIGHT_DUTY' ? 'Select departure time' : 'Select start time')}
                    </Text>
                  </TouchableOpacity>
                  <DateTimePickerModal
                    isVisible={isDeparturePickerVisible}
                    mode="datetime"
                    onConfirm={handleConfirmDeparture}
                    onCancel={() => setDeparturePickerVisible(false)}
                  />

                  {/* Arrival Time (previously End Time) */}
                  {newEventTitle && (
                    <>
                      <Text style={styles.label}>
                        {newEventTitle === 'FLIGHT_DUTY' ? 'Arrival Time (local time)' : 'End Time (local time)'}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          if (newEventTitle !== 'FLIGHT_DUTY' || (newEventOrigin && newEventDestination)) {
                            setArrivalPickerVisible(true)
                          }
                        }}
                        style={[
                          styles.datePicker,
                          newEventTitle === 'FLIGHT_DUTY' && (!newEventOrigin || !newEventDestination)
                            ? { backgroundColor: '#f0f0f0' } // Disabled style
                            : {}
                        ]}
                        disabled={newEventTitle === 'FLIGHT_DUTY' && (!newEventOrigin || !newEventDestination)}
                      >
                        <Ionicons name="time-outline" size={20} color="#045D91" style={styles.inputIcon} />
                        <Text style={[styles.dateText, newEventArrivalTime ? {} : { color: 'grey' }]}>
                          {newEventArrivalTime ||
                            (newEventTitle === 'FLIGHT_DUTY' ? 'Select arrival time' : 'Select end time')}
                        </Text>
                      </TouchableOpacity>
                      <DateTimePickerModal
                        isVisible={isArrivalPickerVisible}
                        mode="datetime"
                        onConfirm={handleConfirmArrival}
                        onCancel={() => setArrivalPickerVisible(false)}
                      />
                    </>
                  )}

                  {/* Flight Number (only for Flight Duty) */}
                  {newEventTitle === 'FLIGHT_DUTY' && (
                    <>
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
                    </>
                  )}

                  {/* Notes */}
                  <Text style={styles.label}>Notes (Optional)</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="clipboard-outline" size={20} color="#045D91" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Notes (Optional)"
                      placeholderTextColor={'grey'}
                      value={newEventNotes}
                      onChangeText={setNewEventNotes}
                    />
                  </View>
                </>
              )}

              <View style={styles.divider} />

              {/* Modal Buttons */}
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
                <TouchableOpacity
                  style={[styles.button, styles.addButton]}
                  onPress={handleAddEvent}
                  disabled={
                    !newEventTitle ||
                    (!['STANDBY', 'TRAINING', 'OFF_DUTY', 'LAYOVER'].includes(newEventTitle) && !newEventOrigin) ||
                    (!['STANDBY', 'TRAINING', 'OFF_DUTY', 'LAYOVER'].includes(newEventTitle) && !newEventDestination) ||
                    !newEventDepartureTime ||
                    (!['STANDBY', 'TRAINING', 'OFF_DUTY', 'LAYOVER'].includes(newEventTitle) && !newEventArrivalTime) ||
                    loading
                  }
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.buttonText}>{editMode ? 'Update' : 'Add'}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal animationType="fade" transparent={true} visible={uploadingRoster} onRequestClose={() => {}}>
        <View style={styles.loadingModalOverlay}>
          <View style={styles.loadingModal}>
            <ActivityIndicator size="large" color="#FFF" />
            <Text style={styles.loadingText}>Uploading roster, please wait...</Text>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showRosterModal}
        onRequestClose={() => setShowRosterModal(false)}
      >
        <SafeAreaView style={rosterModalStyles.modalOverlay}>
          <View style={rosterModalStyles.modalView}>
            <Text style={rosterModalStyles.modalText}>Uploaded Roster</Text>
            <ScrollView style={rosterModalStyles.scrollView}>
              {uploadedRosterData.map((entry, index) => {
                const isFlight = entry.type === 'FLIGHT'

                return (
                  <View key={index} style={rosterModalStyles.rosterItem}>
                    {isFlight ? (
                      <>
                        <Text style={rosterModalStyles.rosterText}>Flight: {entry.flightNumber || 'N/A'}</Text>

                        {/* Date Selector */}
                        <Text style={styles.label}>Select Date</Text>
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedEntryIndex(index)
                            setShowDatePicker(true)
                          }}
                          style={styles.datePicker}
                        >
                          <Ionicons name="calendar-outline" size={20} color="#045D91" style={styles.inputIcon} />
                          <Text style={[styles.dateText, entry.selectedDate ? {} : { color: 'grey' }]}>
                            {entry.selectedDate ? moment(entry.selectedDate).format('DD/MM/YYYY') : 'Select a date'}
                          </Text>
                        </TouchableOpacity>
                        <DateTimePickerModal
                          isVisible={showDatePicker}
                          mode="date"
                          onConfirm={date => {
                            const formattedDate = moment(date).format('YYYY-MM-DD')

                            const updatedRosterData = [...uploadedRosterData]
                            updatedRosterData[selectedEntryIndex].selectedDate = formattedDate

                            setUploadedRosterData(updatedRosterData)
                            setShowDatePicker(false)
                          }}
                          onCancel={() => setShowDatePicker(false)}
                        />

                        {/* Departure Section */}
                        <Text style={rosterModalStyles.sectionHeader}>Departure</Text>
                        <Text style={rosterModalStyles.rosterText}>
                          Time:{' '}
                          {entry.departureTime
                            ? moment
                                .tz(
                                  `${selectedDate || getCurrentDate()} ${entry.departureTime}`,
                                  'YYYY-MM-DD HH:mm',
                                  entry.departureAirport.tz_database
                                )
                                .format('HH:mm [GMT]Z')
                            : 'N/A'}
                        </Text>
                        <Text style={rosterModalStyles.rosterText}>
                          Airport: {entry.departureAirport.name || 'Unknown'} ({entry.departureAirport.IATA}/
                          {entry.departureAirport.ICAO})
                        </Text>
                        <Text style={rosterModalStyles.rosterText}>
                          Location: {entry.departureAirport.city}, {entry.departureAirport.country}
                        </Text>

                        {/* Arrival Section */}
                        <Text style={rosterModalStyles.sectionHeader}>Arrival</Text>
                        <Text style={rosterModalStyles.rosterText}>
                          Time:{' '}
                          {entry.arrivalTime
                            ? moment
                                .tz(
                                  `${selectedDate || getCurrentDate()} ${entry.arrivalTime}`,
                                  'YYYY-MM-DD HH:mm',
                                  entry.arrivalAirport.tz_database
                                )
                                .format('HH:mm [GMT]Z')
                            : 'N/A'}
                        </Text>
                        <Text style={rosterModalStyles.rosterText}>
                          Airport: {entry.arrivalAirport.name || 'Unknown'} ({entry.arrivalAirport.IATA}/
                          {entry.arrivalAirport.ICAO})
                        </Text>
                        <Text style={rosterModalStyles.rosterText}>
                          Location: {entry.arrivalAirport.city}, {entry.arrivalAirport.country}
                        </Text>

                        {/* Overnight Info */}
                        {entry.overnight && <Text style={rosterModalStyles.rosterText}>Overnight: Yes</Text>}
                      </>
                    ) : (
                      <>
                        {/* Standby Section */}
                        <Text style={rosterModalStyles.sectionHeader}>Standby Details</Text>

                        {/* Date Selector for Standby */}
                        <Text style={styles.label}>Select Date</Text>
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedEntryIndex(index)
                            setShowDatePicker(true)
                          }}
                          style={styles.datePicker}
                        >
                          <Ionicons name="calendar-outline" size={20} color="#045D91" style={styles.inputIcon} />
                          <Text style={[styles.dateText, entry.selectedDate ? {} : { color: 'grey' }]}>
                            {entry.selectedDate ? moment(entry.selectedDate).format('DD/MM/YYYY') : 'Select a date'}
                          </Text>
                        </TouchableOpacity>
                        <DateTimePickerModal
                          isVisible={showDatePicker}
                          mode="date"
                          onConfirm={date => {
                            const formattedDate = moment(date).format('YYYY-MM-DD')

                            const updatedRosterData = [...uploadedRosterData]
                            updatedRosterData[selectedEntryIndex].selectedDate = formattedDate

                            setUploadedRosterData(updatedRosterData)
                            setShowDatePicker(false)
                          }}
                          onCancel={() => setShowDatePicker(false)}
                        />

                        {/* Standby Details */}
                        <Text style={rosterModalStyles.rosterText}>Standby Number: {entry.standby || 'N/A'}</Text>
                        <Text style={rosterModalStyles.rosterText}>
                          Start Time:{' '}
                          {entry.startTime
                            ? moment
                                .tz(
                                  `${entry.selectedDate || getCurrentDate()} ${entry.startTime}`,
                                  'YYYY-MM-DD HH:mm',
                                  homebaseTZ
                                )
                                .format('HH:mm [GMT]Z')
                            : 'N/A'}
                        </Text>
                        <Text style={rosterModalStyles.rosterText}>
                          End Time:{' '}
                          {entry.endTime
                            ? moment
                                .tz(
                                  `${entry.selectedDate || getCurrentDate()} ${entry.endTime}`,
                                  'YYYY-MM-DD HH:mm',
                                  homebaseTZ
                                )
                                .format('HH:mm [GMT]Z')
                            : 'N/A'}
                        </Text>
                      </>
                    )}
                  </View>
                )
              })}
            </ScrollView>

            {/* Save Button */}
            <TouchableOpacity
              style={[rosterModalStyles.button, rosterModalStyles.saveButton]}
              onPress={handleSaveUploadedRoster}
            >
              <Text style={rosterModalStyles.buttonText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[rosterModalStyles.button, rosterModalStyles.cancelButton]}
              onPress={() => setShowRosterModal(false)}
            >
              <Text style={rosterModalStyles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <Toast visible={toastVisible} message={toastMessage} duration={3000} onHide={() => setToastVisible(false)} />
    </SafeAreaView>
  )
}

const rosterModalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  sectionHeader: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#045D91',
    marginBottom: 5
  },
  modalView: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 0,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    position: 'relative'
  },
  modalText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15
  },
  scrollView: {
    flex: 1,
    marginTop: 20
  },
  rosterItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd'
    // marginVertical: 10
  },
  rosterText: {
    fontSize: 16,
    marginBottom: 5
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    padding: 10,
    elevation: 2,
    marginTop: 10,
    width: '100%',
    justifyContent: 'center',
    backgroundColor: '#045D91'
  },
  buttonText: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: 16
  },
  cancelButton: {
    backgroundColor: '#FF5C5C'
  }
})

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 18,
    paddingHorizontal: 0,
    borderWidth: 0,
    color: 'black',
    flex: 1,
    height: '100%',
    justifyContent: 'center'
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0,
    color: 'black',
    flex: 1,
    height: '100%',
    justifyContent: 'center'
  },
  placeholder: {
    color: 'grey'
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
    fontSize: 22,
    fontWeight: 'bold',
    color: '#045D91'
  },
  eventActions: {
    flexDirection: 'row'
  },
  eventBody: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingRight: 10
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  eventText: {
    marginLeft: 10,
    color: '#333',
    fontSize: 18,
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
  },
  loadingModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.5)'
  },
  loadingModal: {
    width: 220,
    padding: 20,
    backgroundColor: '#333',
    borderRadius: 12,
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 10,
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center'
  }
})

export default Roster
