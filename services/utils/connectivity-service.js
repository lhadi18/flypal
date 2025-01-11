import NetInfo from '@react-native-community/netinfo'
import { Alert } from 'react-native'

class ConnectivityService {
  static isConnected = false

  static initialize() {
    NetInfo.addEventListener(state => {
      ConnectivityService.isConnected = state.isConnected
    })

    NetInfo.fetch().then(state => {
      ConnectivityService.isConnected = state.isConnected
    })
  }

  static async checkConnection({ showAlert = false } = {}) {
    const state = await NetInfo.fetch()
    // const state = false // Simulate no internet connection (comment out for production/deployment)
    if (!state.isConnected && showAlert) {
      ConnectivityService.showNoConnectionAlert()
    }
    return state.isConnected
  }

  static showNoConnectionAlert() {
    Alert.alert('No Internet Connection', 'Please try again later')
  }
}

export default ConnectivityService
