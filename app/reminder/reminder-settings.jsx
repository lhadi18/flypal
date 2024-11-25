import { View, Text, Switch, SafeAreaView, ScrollView, StyleSheet, Button } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getAllRosterEntries } from '../../services/utils/database'
import Slider from '@react-native-community/slider'
import * as Notifications from 'expo-notifications'
import React, { useState, useEffect } from 'react'
import moment from 'moment-timezone'

// Constants for keys used to store settings
const NOTIFICATIONS_ENABLED_KEY = 'notificationsEnabled'
const CUSTOM_REMINDER_HOUR_KEY = 'customReminderHour'
const REST_REMINDER_ENABLED_KEY = 'restReminderEnabled'
const RED_EYE_REMINDER_TIME_KEY = 'redEyeReminderTime'

const getInitialRedEyeReminderTime = () => {
  const date = new Date()
  date.setHours(18, 0, 0, 0) // Set to 18:00 (6:00 PM)
  return date
}

const ReminderSettings = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [redEyeReminderTime, setRedEyeReminderTime] = useState(getInitialRedEyeReminderTime())
  const [customReminderHour, setCustomReminderHour] = useState(2) // Default to 2 hours before flight
  const [restReminderEnabled, setRestReminderEnabled] = useState(false)

  // Load the saved settings when the component mounts
  useEffect(() => {
    loadSettings()
  }, [])

  useEffect(() => {
    let timeoutId
    const debounceUpdate = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        updateNotificationSettings()
      }, 300)
    }

    debounceUpdate()

    // Cleanup function to clear pending timeouts
    return () => clearTimeout(timeoutId)
  }, [notificationsEnabled, customReminderHour, restReminderEnabled, redEyeReminderTime])

  // Function to save settings to AsyncStorage
  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, JSON.stringify(notificationsEnabled))
      await AsyncStorage.setItem(CUSTOM_REMINDER_HOUR_KEY, JSON.stringify(customReminderHour))
      await AsyncStorage.setItem(REST_REMINDER_ENABLED_KEY, JSON.stringify(restReminderEnabled))
      await AsyncStorage.setItem(RED_EYE_REMINDER_TIME_KEY, JSON.stringify(redEyeReminderTime))
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  // Function to load settings from AsyncStorage
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
        setRedEyeReminderTime(new Date(JSON.parse(savedRedEyeReminderTime)))
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  // Save settings whenever they are changed
  useEffect(() => {
    saveSettings()
    updateNotificationSettings() // Call to update notifications whenever settings change
  }, [notificationsEnabled, customReminderHour, restReminderEnabled, redEyeReminderTime])

  // Function to cancel and reschedule notifications based on updated settings
  const updateNotificationSettings = async () => {
    // Cancel all pending notifications
    await Notifications.cancelAllScheduledNotificationsAsync()

    const events = await getAllRosterEntries()
    const now = moment()

    // Filter future events
    const futureEvents = events.filter(event => {
      const departureTime = moment.tz(event.departureTime, event.origin.tz_database)
      return departureTime.isAfter(now)
    })

    // Reschedule notifications only if enabled
    if (notificationsEnabled) {
      futureEvents.forEach(async event => {
        // Regular reminders
        await scheduleNotification(event, customReminderHour)

        const eventTime = moment.tz(event.departureTime, event.origin.tz_database)
        const departureHour = eventTime.hour()

        // Red-eye reminders
        if (departureHour >= 0 && departureHour <= 7) {
          await scheduleRedEyeReminder(event, redEyeReminderTime.getHours())
        }
      })
    }
  }

  const scheduleNotification = async (event, reminderHoursBefore) => {
    const permissionGranted = await Notifications.requestPermissionsAsync()
    if (!permissionGranted) return

    const eventTime = moment.tz(event.departureTime, event.origin.tz_database)
    const reminderTime = eventTime.subtract(reminderHoursBefore, 'hours')

    if (reminderTime.isAfter(moment())) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Upcoming Flight: ${event.flightNumber}`,
          body: `Flight from ${event.origin.IATA} to ${event.destination.IATA} is departing in ${reminderHoursBefore} hours!`,
          sound: 'default',
          badge: 1
        },
        trigger: {
          date: new Date(reminderTime)
        }
      })
    }
  }

  const scheduleRedEyeReminder = async (event, redEyeReminderTime) => {
    const permissionGranted = await Notifications.requestPermissionsAsync()
    if (!permissionGranted) return

    const eventTime = moment.tz(event.departureTime, event.origin.tz_database)
    const departureHour = eventTime.hour()

    if (departureHour >= 0 && departureHour <= 7) {
      // Set the reminder for the day before at the given redEyeReminderTime
      const reminderDayBefore = eventTime.clone().subtract(1, 'day').set('hour', redEyeReminderTime).set('minute', 0)

      if (reminderDayBefore.isAfter(moment())) {
        // Format the departure time with local time and GMT offset
        const formattedDepartureTime = eventTime.format('DD/MM/YYYY HH:mm [GMT]Z')

        // Schedule the notification with the formatted departure time
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

  // Function to check pending notifications
  const checkPendingNotifications = async () => {
    try {
      const pendingNotifications = await Notifications.getAllScheduledNotificationsAsync()
      if (pendingNotifications.length === 0) {
        console.log('No pending notifications found.')
      } else {
        console.log('Pending Notifications:', pendingNotifications)
      }
    } catch (error) {
      console.error('Error fetching pending notifications:', error)
    }
  }

  const toggleNotifications = () => setNotificationsEnabled(prev => !prev)
  const toggleRestReminder = () => setRestReminderEnabled(prev => !prev)

  const getTimeForToday = (hours, minutes) => {
    const date = new Date()
    date.setHours(hours)
    date.setMinutes(minutes)
    date.setSeconds(0)
    return date
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Toggle for enabling/disabling notifications */}
        <View style={styles.setting}>
          <Text style={styles.label}>Enable Notifications</Text>
          <Switch value={notificationsEnabled} onValueChange={toggleNotifications} />
        </View>

        {/* Toggle for enabling/disabling rest reminders */}
        {/* <View style={styles.setting}>
          <Text style={styles.label}>Enable Rest Period Reminders</Text>
          <Switch value={restReminderEnabled} onValueChange={toggleRestReminder} />
        </View> */}

        {/* Custom reminder time slider */}
        <View style={styles.setting}>
          <Text style={styles.label}>Custom Reminder Time (Hours Before Flight)</Text>
          <Slider
            style={{ width: 300, height: 40 }}
            minimumValue={1}
            maximumValue={24}
            step={1}
            value={customReminderHour}
            onValueChange={setCustomReminderHour}
          />
          <Text>Reminder Time: {customReminderHour} hours before the flight</Text>
        </View>

        {/* Red-eye flight reminder time slider */}
        <View style={styles.setting}>
          <Text style={styles.label}>Red-Eye Flight Reminder Time</Text>
          <Slider
            style={{ width: 300, height: 40 }}
            minimumValue={18}
            maximumValue={22}
            step={0.5}
            value={redEyeReminderTime.getHours() + redEyeReminderTime.getMinutes() / 60}
            onValueChange={value => setRedEyeReminderTime(getTimeForToday(Math.floor(value), (value % 1) * 60))}
          />
          <Text>
            Selected Red-Eye Reminder Time:{' '}
            {redEyeReminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {/* Time Zone awareness message */}
        <View style={styles.setting}>
          <Text style={styles.infoText}>Reminder times will be adjusted according to your local time zone.</Text>
        </View>

        {/* Button to check pending notifications */}
        <View style={styles.setting}>
          <Button title="Check Pending Notifications" onPress={checkPendingNotifications} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollViewContent: {
    padding: 20
  },
  setting: {
    marginVertical: 15
  },
  label: {
    fontSize: 16,
    marginBottom: 5
  },
  infoText: {
    fontSize: 14,
    color: 'gray',
    marginTop: 10
  }
})

export default ReminderSettings
