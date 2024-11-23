import { getAllRosterEntries } from '../utils/database'
import * as Notifications from 'expo-notifications'
import moment from 'moment-timezone'

/**
 * Request notification permission from the user.
 * @returns {Promise<boolean>}
 */
export const requestNotificationPermission = async () => {
  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

/**
 * Schedule a flight notification.
 * @param {Object} event - The event object containing flight details.
 * @param {number} reminderHoursBefore - Hours before the flight to send the reminder.
 */
export const scheduleNotification = async (event, reminderHoursBefore) => {
  const permissionGranted = await requestNotificationPermission()
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

/**
 * Schedule a red-eye flight reminder notification.
 * @param {Object} event - The event object containing flight details.
 * @param {number} redEyeReminderTime - Time (in 24-hour format) to send the red-eye reminder.
 */
export const scheduleRedEyeReminder = async (event, redEyeReminderTime) => {
  const permissionGranted = await requestNotificationPermission()
  if (!permissionGranted) return

  const eventTime = moment.tz(event.departureTime, event.origin.tz_database)
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

/**
 * Cancel all scheduled notifications.
 */
export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync()
}

/**
 * Reschedule notifications based on updated settings.
 * @param {boolean} notificationsEnabled - Whether notifications are enabled.
 * @param {number} customReminderHour - Custom reminder time in hours before flight.
 * @param {number} redEyeReminderTime - Time (in 24-hour format) to send red-eye reminders.
 */
export const updateNotificationSettings = async (notificationsEnabled, customReminderHour, redEyeReminderTime) => {
  await cancelAllNotifications()

  const events = await getAllRosterEntries()
  const now = moment()

  const futureEvents = events.filter(event => {
    const departureTime = moment.tz(event.departureTime, event.origin.tz_database)
    return departureTime.isAfter(now)
  })

  if (notificationsEnabled) {
    futureEvents.forEach(async event => {
      await scheduleNotification(event, customReminderHour)

      const eventTime = moment.tz(event.departureTime, event.origin.tz_database)
      const departureHour = eventTime.hour()

      if (departureHour >= 0 && departureHour <= 7) {
        await scheduleRedEyeReminder(event, redEyeReminderTime)
      }
    })
  }
}
