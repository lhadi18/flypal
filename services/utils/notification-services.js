import * as Notifications from 'expo-notifications'
import { getAllRosterEntries } from './database'
import moment from 'moment-timezone'

/**
 * Request notification permissions from the user.
 * @returns {Promise<boolean>} - Whether permission was granted.
 */
export const requestNotificationPermission = async () => {
  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

/**
 * Cancel all scheduled notifications.
 */
export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync()
}

/**
 * Schedule a notification for a specific event.
 * @param {Object} event - Event object containing details for the notification.
 * @param {number} reminderHoursBefore - Time in hours before the event to send the notification.
 * @param {string} homebaseTZ - Default timezone if event-specific timezone is unavailable.
 */
export const scheduleNotification = async (event, reminderHoursBefore, homebaseTZ) => {
  const permissionGranted = await requestNotificationPermission()
  if (!permissionGranted) return

  const timezone = event.origin?.tz_database || homebaseTZ
  const eventStartTime = event.departureTime ? moment.tz(event.departureTime, timezone) : null

  if (!eventStartTime || !eventStartTime.isValid()) {
    console.warn('Invalid or missing start time for event:', event)
    return
  }

  const reminderTime = eventStartTime.clone().subtract(reminderHoursBefore, 'hours')
  if (reminderTime.isAfter(moment())) {
    let notificationTitle = 'Upcoming Event Reminder'
    let notificationBody = `You have an upcoming event starting in ${reminderHoursBefore} hours.`

    switch (event.type) {
      case 'STANDBY':
        notificationTitle = 'Standby Duty Reminder'
        notificationBody = `Your standby duty starts in ${reminderHoursBefore} hours.`
        break
      case 'TRAINING':
        notificationTitle = 'Training Reminder'
        notificationBody = `Your training session starts in ${reminderHoursBefore} hours.`
        break
      case 'FLIGHT_DUTY':
        notificationTitle = `Flight Duty Reminder: ${event.flightNumber || 'N/A'}`
        notificationBody = `Your flight from ${event.origin?.IATA || 'N/A'} to ${
          event.destination?.IATA || 'N/A'
        } departs in ${reminderHoursBefore} hours.`
        break
      default:
        notificationTitle = 'Event Reminder'
        notificationBody = `You have an upcoming ${event.type || 'event'} starting in ${reminderHoursBefore} hours.`
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: notificationTitle,
        body: notificationBody,
        sound: 'default',
        badge: 1
      },
      trigger: { date: new Date(reminderTime) },
      identifier: `${event.id}-${reminderHoursBefore}`
    })
  }
}

/**
 * Schedule a red-eye flight notification.
 * @param {Object} event - Event object containing flight details.
 * @param {number} redEyeReminderTime - Time in hours (24-hour format) for the red-eye notification.
 * @param {string} homebaseTZ - Default timezone.
 */
export const scheduleRedEyeReminder = async (event, redEyeReminderTime, homebaseTZ) => {
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
        trigger: { date: new Date(reminderDayBefore) },
        identifier: `${event.id}-${redEyeReminderTime}`
      })
    }
  }
}

/**
 * Reschedule all notifications based on updated settings.
 * @param {boolean} notificationsEnabled - Whether notifications are enabled.
 * @param {number} customReminderHour - Time in hours before events for notifications.
 * @param {number} redEyeReminderTime - Time in 24-hour format for red-eye reminders.
 * @param {string} homebaseTZ - Default timezone.
 */
export const rescheduleNotifications = async (
  notificationsEnabled,
  customReminderHour,
  redEyeReminderTime,
  homebaseTZ,
  userId
) => {
  await cancelAllNotifications()

  if (!notificationsEnabled) return

  const events = await getAllRosterEntries(userId)
  const now = moment()

  const futureEvents = events.filter(event => {
    const departureTime = moment.tz(event.departureTime, event.origin?.tz_database || homebaseTZ)
    return departureTime.isAfter(now)
  })

  for (const event of futureEvents) {
    await scheduleNotification(event, customReminderHour, homebaseTZ)

    const eventTime = moment.tz(event.departureTime, event.origin?.tz_database || homebaseTZ)
    const departureHour = eventTime.hour()

    if (departureHour >= 0 && departureHour <= 7) {
      await scheduleRedEyeReminder(event, redEyeReminderTime, homebaseTZ)
    }
  }
}
