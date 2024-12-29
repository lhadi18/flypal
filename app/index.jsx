import 'react-native-get-random-values'
import {
  SafeAreaView,
  ScrollView,
  View,
  Image,
  Text,
  TouchableOpacity,
  ImageBackground,
  StyleSheet
} from 'react-native'
import ConnectivityService from '../services/utils/connectivity-service'
import { initializeDatabase } from '../services/utils/database'
import { handlePushToken } from '../services/utils/push-token'
import { validateUserId } from '../services/apis/user-api'
import * as Notifications from 'expo-notifications'
import * as SecureStore from 'expo-secure-store'
import { useRouter, Link } from 'expo-router'
import React, { useEffect } from 'react'

const App = () => {
  const router = useRouter()

  useEffect(() => {
    ConnectivityService.initialize()
    initializeDatabase()

    const checkNotificationPermissions = async () => {
      const { status } = await Notifications.getPermissionsAsync()
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync()
        if (newStatus !== 'granted') {
          console.warn('Notification permissions not granted.')
          return
        }
      }
    }

    // Re-authenticate user
    const reAuthenticate = async () => {
      try {
        const userId = await SecureStore.getItemAsync('userId')
        const isConnected = await ConnectivityService.checkConnection()

        if (userId && !isConnected) {
          router.replace('/roster')
        }

        if (userId) {
          const isValid = await validateUserId(userId)
          if (isValid) {
            await handlePushToken(userId) // Generate and save push token
            router.replace('/roster')
          } else {
            router.replace('/sign-in')
          }
        } else {
          router.replace('/sign-in')
        }
      } catch {
        router.replace('/sign-in')
      }
    }

    checkNotificationPermissions()
    reAuthenticate()
  }, [])

  return (
    <ImageBackground source={require('../assets/images/landing-background.jpeg')} style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.overlay} />
        <ScrollView contentContainerStyle={styles.scrollViewContent} style={styles.scrollView}>
          <View style={styles.container}>
            <Image source={require('../assets/images/flypal-logo.png')} style={styles.logo} />
            <Text style={styles.welcomeText}>FlyPal</Text>
            <Link href="/sign-in" asChild>
              <TouchableOpacity style={styles.loginButton}>
                <Text style={styles.loginButtonText}>Login</Text>
              </TouchableOpacity>
            </Link>
            <Link href="/sign-up" asChild>
              <TouchableOpacity style={styles.registerButton}>
                <Text style={styles.registerButtonText}>Register</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  background: {
    flex: 1
  },
  safeArea: {
    flex: 1
  },
  scrollView: {
    flex: 1
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.5)'
  },
  container: {
    alignItems: 'center',
    paddingHorizontal: 16
  },
  logo: {
    width: 255,
    height: 265,
    marginBottom: 20
  },
  welcomeText: {
    fontSize: 32,
    fontFamily: 'Roboto',
    color: 'black',
    marginBottom: 40,
    fontWeight: '600'
  },
  loginButton: {
    width: 320,
    backgroundColor: '#045D91',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 200
  },
  loginButtonText: {
    color: 'white',
    fontFamily: 'Roboto',
    fontSize: 16,
    textAlign: 'center'
  },
  registerButton: {
    width: 320,
    backgroundColor: 'white',
    borderColor: '#045D91',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center'
  },
  registerButtonText: {
    color: '#045D91',
    fontFamily: 'Roboto',
    fontSize: 16,
    textAlign: 'center'
  }
})

export default App
