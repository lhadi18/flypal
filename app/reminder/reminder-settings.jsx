import { updateNotificationSettings } from '../../services/notifications/notification-services'
import { View, Text, Switch, SafeAreaView, ScrollView, StyleSheet, Button } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Slider from '@react-native-community/slider'
import * as Notifications from 'expo-notifications'
import React, { useState, useEffect } from 'react'

// Constants for keys used to store settings
const NOTIFICATIONS_ENABLED_KEY = 'notificationsEnabled'
const CUSTOM_REMINDER_HOUR_KEY = 'customReminderHour'
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

  useEffect(() => {
    loadSettings()
  }, [])

  useEffect(() => {
    saveSettings()
    updateNotificationSettings(notificationsEnabled, customReminderHour, redEyeReminderTime.getHours())
  }, [notificationsEnabled, customReminderHour, redEyeReminderTime])

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, JSON.stringify(notificationsEnabled))
      await AsyncStorage.setItem(CUSTOM_REMINDER_HOUR_KEY, JSON.stringify(customReminderHour))
      await AsyncStorage.setItem(RED_EYE_REMINDER_TIME_KEY, JSON.stringify(redEyeReminderTime))
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  const loadSettings = async () => {
    try {
      const savedNotificationsEnabled = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY)
      const savedCustomReminderHour = await AsyncStorage.getItem(CUSTOM_REMINDER_HOUR_KEY)
      const savedRedEyeReminderTime = await AsyncStorage.getItem(RED_EYE_REMINDER_TIME_KEY)

      if (savedNotificationsEnabled !== null) {
        setNotificationsEnabled(JSON.parse(savedNotificationsEnabled))
      }
      if (savedCustomReminderHour !== null) {
        setCustomReminderHour(JSON.parse(savedCustomReminderHour))
      }
      if (savedRedEyeReminderTime !== null) {
        setRedEyeReminderTime(new Date(JSON.parse(savedRedEyeReminderTime)))
      }
    } catch (error) {
      console.error('Error loading settings:', error)
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
        alert('No notifications scheduled.')
      } else {
        console.log('Scheduled Notifications:', scheduledNotifications)
        alert(`Scheduled Notifications: ${scheduledNotifications.length}`)
      }
    } catch (error) {
      console.error('Error checking scheduled notifications:', error)
      alert('Error checking scheduled notifications.')
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
