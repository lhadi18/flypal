import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications'
import moment from 'moment-timezone'

const NOTIFICATIONS_ENABLED_KEY = 'notificationsEnabled'
const CUSTOM_REMINDER_HOUR_KEY = 'customReminderHour'
const RED_EYE_REMINDER_TIME_KEY = 'redEyeReminderTime'

/**
 * Requests notification permissions from the user.
 * @returns {Promise<boolean>} - Returns `true` if permission is granted.
 */
export const requestNotificationPermission = async () => {
  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

/**
 * Cancels all scheduled notifications.
 */
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync()
  } catch (error) {
    console.error('Error canceling all notifications:', error)
  }
}

/**
 * Generates a notification title and body based on event type.
 * @param {Object} event - The event object containing details.
 * @param {number} reminderHoursBefore - Hours before the event.
 * @returns {Object} - The title and body for the notification.
 */
const generateNotificationContent = (event, reminderHoursBefore) => {
  let title = 'Event Reminder'
  let body = `Your event starts in ${reminderHoursBefore} hours.`

  switch (event.type) {
    case 'FLIGHT_DUTY':
      title = `Flight Duty Reminder ${event.flightNumber || ''}`
      body = `Your flight from ${event.origin?.IATA || 'N/A'} to ${event.destination?.IATA || 'N/A'} departs in ${reminderHoursBefore} hours.`
      break

    case 'STANDBY':
      title = 'Standby Duty Reminder'
      body = `Your standby duty starts in ${reminderHoursBefore} hours.`
      break

    case 'LAYOVER':
      title = 'Layover Reminder'
      body = `Your layover at ${event.origin?.name} (${event.origin?.IATA}) starts in ${reminderHoursBefore} hours.`
      break

    case 'TRAINING':
      title = 'Training Reminder'
      body = `Your training session starts in ${reminderHoursBefore} hours.`
      break

    case 'OFF_DUTY':
      title = 'Off Duty Reminder'
      body = `Enjoy your off-duty time! It begins in ${reminderHoursBefore} hours.`
      break

    case 'MEETING':
      title = 'Meeting Reminder'
      body = `Your meeting starts in ${reminderHoursBefore} hours.`
      break

    case 'MEDICAL_CHECK':
      title = 'Medical Check Reminder'
      body = `Your medical check starts in ${reminderHoursBefore} hours.`
      break

    default:
      title = `Reminder for ${event.type || 'Event'}`
      body = `You have an upcoming event starting in ${reminderHoursBefore} hours.`
      break
  }

  return { title, body }
}

/**
 * Schedules a notification for a specific event.
 * @param {Object} event - The event object containing details.
 * @param {number} reminderHoursBefore - Hours before the event to trigger the notification.
 * @param {string} timezone - The timezone for the event.
 */
export const scheduleNotification = async (event, reminderHoursBefore, timezone) => {
  const permissionGranted = await requestNotificationPermission()
  if (!permissionGranted) return

  const eventStartTime = event.departureTime ? moment.tz(event.departureTime, timezone) : null

  if (!eventStartTime || !eventStartTime.isValid()) {
    console.warn('Invalid or missing start time for event:', event)
    return
  }

  console.log('timezone: ', timezone)

  await cancelNotificationForEvent(event.id)

  const reminderTime = eventStartTime.clone().subtract(reminderHoursBefore, 'hours')

  if (reminderTime.isAfter(moment())) {
    const { title, body } = generateNotificationContent(event, reminderHoursBefore)

    await Notifications.scheduleNotificationAsync({
      identifier: event.id,
      content: {
        title,
        body,
        sound: 'default',
        icon: '../../assets/images/icon.png'
      },
      trigger: {
        date: reminderTime.toDate()
      }
    })
  }
}

/**
 * Schedules a red-eye reminder for an event.
 * @param {Object} event - The event object containing details.
 * @param {number} redEyeReminderTime - The hour of the day for red-eye reminders.
 * @param {string} timezone - The timezone for the event.
 */
export const scheduleRedEyeReminder = async (event, redEyeReminderTime, timezone) => {
  const permissionGranted = await requestNotificationPermission()
  if (!permissionGranted) return

  const eventTime = moment.tz(event.departureTime, timezone)
  const departureHour = eventTime.hour()

  if (departureHour >= 0 && departureHour <= 7) {
    const reminderDayBefore = eventTime.clone().subtract(1, 'day').set({
      hour: redEyeReminderTime,
      minute: 0
    })

    if (reminderDayBefore.isAfter(moment())) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Red-Eye Flight Reminder`,
          body: `Your flight departs at ${eventTime.format('HH:mm [GMT]Z')}. Don't forget to prepare.`,
          sound: 'default',
          icon: '../../assets/images/icon.png'
        },
        trigger: {
          date: reminderDayBefore.toDate()
        }
      })
    }
  }
}

/**
 * Reschedules all notifications based on updated settings.
 * @param {boolean} notificationsEnabled - Whether notifications are enabled.
 * @param {number} customReminderHour - Hours before the event to send reminders.
 * @param {number} redEyeReminderTime - The hour of the day for red-eye reminders.
 * @param {string} timezone - The homebase timezone.
 * @param {Array} events - The list of events to schedule notifications for.
 */
export const rescheduleNotifications = async (
  notificationsEnabled,
  customReminderHour,
  redEyeReminderTime,
  timezone,
  events
) => {
  if (!notificationsEnabled) {
    await cancelAllNotifications()
    return
  }
  // Cancel notifications for all existing events
  for (const event of events) {
    await cancelNotificationForEvent(event.id)
  }

  // Schedule notifications for all events
  for (const event of events) {
    await scheduleNotification(event, customReminderHour, timezone)

    if (event.type === 'FLIGHT_DUTY') {
      await scheduleRedEyeReminder(event, redEyeReminderTime, timezone)
    }
  }
  const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync()
  console.log(scheduledNotifications)
}

/**
 * Loads notification settings from AsyncStorage.
 * @returns {Promise<Object>} - The settings object.
 */
export const loadNotificationSettings = async () => {
  const [notificationsEnabled, customReminderHour, redEyeReminderTime] = await Promise.all([
    AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY),
    AsyncStorage.getItem(CUSTOM_REMINDER_HOUR_KEY),
    AsyncStorage.getItem(RED_EYE_REMINDER_TIME_KEY)
  ])

  return {
    notificationsEnabled: notificationsEnabled !== null ? JSON.parse(notificationsEnabled) : true,
    customReminderHour: customReminderHour !== null ? JSON.parse(customReminderHour) : 2,
    redEyeReminderTime: redEyeReminderTime !== null ? JSON.parse(redEyeReminderTime) : 18
  }
}

/**
 * Saves notification settings to AsyncStorage.
 * @param {Object} settings - The settings object to save.
 */
export const saveNotificationSettings = async settings => {
  await AsyncStorage.multiSet([
    [NOTIFICATIONS_ENABLED_KEY, JSON.stringify(settings.notificationsEnabled)],
    [CUSTOM_REMINDER_HOUR_KEY, JSON.stringify(settings.customReminderHour)],
    [RED_EYE_REMINDER_TIME_KEY, JSON.stringify(settings.redEyeReminderTime)]
  ])
}

/**
 * Saves notification settings to AsyncStorage.
 * @param {string} eventId - The identifier of the event and notification.
 */
export const cancelNotificationForEvent = async eventId => {
  try {
    const allNotifications = await Notifications.getAllScheduledNotificationsAsync()
    for (const notification of allNotifications) {
      if (notification.identifier === eventId) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier)
      }
    }
  } catch (error) {
    console.error(`Error canceling notification for event ${eventId}:`, error)
  }
}
