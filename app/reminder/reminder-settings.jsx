// Import notification-related functions
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
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getAllRosterEntries } from '@/services/utils/database'
import eventEmitter from '../../services/utils/event-emitter'
import Slider from '@react-native-community/slider'
import * as Notifications from 'expo-notifications'
import React, { useState, useEffect } from 'react'
import * as SecureStore from 'expo-secure-store'

const ReminderSettings = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [redEyeReminderTime, setRedEyeReminderTime] = useState(new Date())
  const [customReminderHour, setCustomReminderHour] = useState(2) // Default to 2 hours before flight
  const [homebaseTZ, setHomebaseTZ] = useState('UTC') // Default timezone

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
      setRedEyeReminderTime(new Date(settings.redEyeReminderTime))
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const saveAndRescheduleNotifications = async () => {
    try {
      await saveNotificationSettings({
        notificationsEnabled,
        customReminderHour,
        redEyeReminderTime: redEyeReminderTime.toISOString()
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
        await rescheduleNotifications(
          notificationsEnabled,
          customReminderHour,
          redEyeReminderTime.getHours(),
          homebaseTZ,
          events
        )
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

  const getTimeForToday = (hours, minutes) => {
    const date = new Date()
    date.setHours(hours)
    date.setMinutes(minutes)
    date.setSeconds(0)
    return date
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
          <Switch value={notificationsEnabled} onValueChange={toggleNotifications} />
        </View>

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

        {/* Button to check pending notifications */}
        <View style={styles.setting}>
          <Button title="Check Pending Notifications" onPress={checkScheduledNotifications} />
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
  }
})

export default ReminderSettings
