import * as Notifications from 'expo-notifications'
import * as SecureStore from 'expo-secure-store'
import * as Device from 'expo-device'

export const handlePushToken = async userId => {
  try {
    const { status } = await Notifications.getPermissionsAsync()
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync()
      if (newStatus !== 'granted') {
        console.warn('Notification permissions not granted.')
        return
      }
    }

    const projectId = 'fd0519bb-1497-41ce-b287-d06b4bca077e'
    const pushToken = await Notifications.getExpoPushTokenAsync({ projectId })
    const storedToken = await SecureStore.getItemAsync('pushToken')
    const deviceId = Device.osBuildId || Device.deviceName || 'unknown-device-id'

    if (storedToken !== pushToken.data) {
      console.log('New push token detected, saving to server.')
      await fetch('https://1c32-103-18-0-19.ngrok-free.app/api/push-token/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, token: pushToken.data, deviceId })
      })

      await SecureStore.setItemAsync('pushToken', pushToken.data)
      console.log('Push token saved locally.')
    } else {
      console.log('Push token has not changed, no update needed.')
    }
  } catch (error) {
    console.error('Error handling push token:', error)
  }
}
