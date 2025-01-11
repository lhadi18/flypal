import {
  scheduleNotification,
  scheduleRedEyeReminder,
  cancelAllNotifications,
  requestNotificationPermission,
  rescheduleNotifications,
  loadNotificationSettings,
  saveNotificationSettings
} from '../../services/utils/notification-services'
import { View, Text, Switch, SafeAreaView, ScrollView, StyleSheet, Button } from 'react-native'
import { getAllRosterEntries } from '@/services/utils/database'
import eventEmitter from '../../services/utils/event-emitter'
import React, { useState, useEffect, useRef } from 'react'
import Slider from '@react-native-community/slider'
import * as SecureStore from 'expo-secure-store'
import { debounce } from 'lodash'

const ReminderSettings = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [redEyeReminderTime, setRedEyeReminderTime] = useState(18) // Default 6:00 PM
  const [customReminderHour, setCustomReminderHour] = useState(2) // Default to 2 hours before flight
  const [homebaseTZ, setHomebaseTZ] = useState('UTC') // Default timezone

  // Local state to track the slider's live value
  const [liveCustomReminderHour, setLiveCustomReminderHour] = useState(customReminderHour)
  const [liveRedEyeReminderTime, setLiveRedEyeReminderTime] = useState(redEyeReminderTime)

  // Create debounced versions of the setters
  const debouncedSetCustomReminderHour = useRef(debounce(value => setCustomReminderHour(value), 300)).current
  const debouncedSetRedEyeReminderTime = useRef(debounce(value => setRedEyeReminderTime(value), 300)).current

  useEffect(() => {
    initializeSettings()
    fetchHomebaseTimezone()
  }, [])

  useEffect(() => {
    saveAndRescheduleNotifications()
  }, [notificationsEnabled, customReminderHour, redEyeReminderTime, homebaseTZ])

  const initializeSettings = async () => {
    try {
      const settings = await loadNotificationSettings()
      setNotificationsEnabled(settings.notificationsEnabled)
      setCustomReminderHour(settings.customReminderHour)
      setRedEyeReminderTime(settings.redEyeReminderTime)
      setLiveCustomReminderHour(settings.customReminderHour)
      setLiveRedEyeReminderTime(settings.redEyeReminderTime)
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const saveAndRescheduleNotifications = async () => {
    try {
      await saveNotificationSettings({
        notificationsEnabled,
        customReminderHour,
        redEyeReminderTime
      })

      eventEmitter.emit('settingsChanged', {
        notificationsEnabled,
        customReminderHour,
        redEyeReminderTime
      })

      if (notificationsEnabled) {
        const userId = await SecureStore.getItemAsync('userId')
        const events = await getAllRosterEntries(userId)
        await requestNotificationPermission()
        await rescheduleNotifications(notificationsEnabled, customReminderHour, redEyeReminderTime, homebaseTZ, events)
      } else {
        await cancelAllNotifications()
      }
    } catch (error) {
      console.error('Error saving and rescheduling notifications:', error)
    }
  }

  const fetchHomebaseTimezone = async () => {
    try {
      const tz = await SecureStore.getItemAsync('homebaseTZDatabase')
      if (tz) {
        setHomebaseTZ(tz)
      } else {
        console.warn('Homebase timezone not found. Using default: UTC')
      }
    } catch (error) {
      console.error('Error fetching home base timezone:', error)
    }
  }

  const toggleNotifications = () => setNotificationsEnabled(prev => !prev)

  const formatTime = value => {
    const hours = Math.floor(value)
    const minutes = (value % 1) * 60
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
    return `${displayHours}:${minutes === 0 ? '00' : '30'} ${ampm}`
  }

  const checkScheduledNotifications = async () => {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync()
      if (scheduledNotifications.length === 0) {
        console.log('No notifications scheduled.')
      } else {
        console.log(`Scheduled Notifications:`, scheduledNotifications)
      }
    } catch (error) {
      console.error('Error checking scheduled notifications:', error)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Toggle for enabling/disabling notifications */}
        <View style={styles.setting}>
          <Text style={styles.label}>Enable Notifications</Text>
          <Switch style={styles.switch} value={notificationsEnabled} onValueChange={toggleNotifications} />
        </View>

        {/* Custom reminder time slider */}
        <View style={styles.setting}>
          <Text style={styles.label}>Custom Reminder Time</Text>
          <Slider
            style={{ width: 300, height: 40 }}
            minimumValue={1}
            maximumValue={24}
            step={1}
            value={liveCustomReminderHour}
            onValueChange={value => {
              setLiveCustomReminderHour(value) // Update local live value instantly
              debouncedSetCustomReminderHour(value) // Debounced backend update
            }}
          />
          <Text>
            Reminder Time: {liveCustomReminderHour} {liveCustomReminderHour === 1 ? 'hour' : 'hours'} prior
          </Text>
        </View>

        {/* Red-eye flight reminder time slider */}
        <View style={styles.setting}>
          <Text style={styles.label}>Red-Eye Flight Reminder Time</Text>
          <Slider
            style={{ width: 300, height: 40 }}
            minimumValue={18}
            maximumValue={22}
            step={0.5}
            value={liveRedEyeReminderTime}
            onValueChange={value => {
              setLiveRedEyeReminderTime(value)
              debouncedSetRedEyeReminderTime(value)
            }}
          />
          <Text>Selected Red-Eye Reminder Time: {formatTime(liveRedEyeReminderTime)}</Text>
        </View>

        {/* Button to check pending notifications */}
        {/* Uncomment for debugging */}
        {/* <View style={styles.setting}>
          <Button title="Check Pending Notifications" onPress={checkScheduledNotifications} />
        </View> */}
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
  switch: {
    alignSelf: 'flex-start'
  }
})

export default ReminderSettings
