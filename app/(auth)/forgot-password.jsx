import {
  View,
  Text,
  Image,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  SafeAreaView
} from 'react-native'
import { useRouter } from 'expo-router'
import React, { useState } from 'react'
import axios from 'axios'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const router = useRouter()

  const handleForgotPassword = async () => {
    if (!email || !newPassword) {
      Alert.alert('Error', 'Please enter your email and a new password.')
      return
    }

    try {
      const response = await axios.post(
        'https://c6f8-103-18-0-18.ngrok-free.app/api/users/forgotPassword', // Replace with your actual backend URL
        { email, newPassword }
      )
      if (response.status === 200) {
        Alert.alert('Success', 'Password has been reset. Please log in with your new password.')
        router.push('/sign-in')
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      Alert.alert('Error', error.response?.data?.message || 'Failed to reset password.')
    }
  }

  return (
    <ImageBackground source={require('../../assets/images/landing-background.jpeg')} style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.overlay}>
          <View style={styles.container}>
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subtitle}>Enter your email and a new password to reset it.</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.emailContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="grey"
                />
              </View>
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.passwordInput, { paddingRight: 40 }]}
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!passwordVisible}
                  placeholderTextColor="grey"
                />
                <TouchableOpacity style={styles.toggleButton} onPress={() => setPasswordVisible(!passwordVisible)}>
                  <Image
                    source={
                      passwordVisible
                        ? require('../../assets/icons/pass-hide.png')
                        : require('../../assets/icons/pass-show.png')
                    }
                    style={styles.toggleButtonImage}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.resetButton} onPress={handleForgotPassword}>
              <Text style={styles.resetButtonText}>Reset Password</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.goBackButton} onPress={() => router.push('/sign-in')}>
              <Text style={styles.goBackText}>Go back to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.6)'
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    color: 'grey',
    textAlign: 'left'
  },
  inputContainer: {
    marginBottom: 15
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#636363'
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: 'grey',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: 'white'
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 5,
    backgroundColor: 'white',
    height: 40
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 5,
    borderColor: 'grey',
    backgroundColor: 'white',
    paddingHorizontal: 10,
    height: 40
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    backgroundColor: 'white',
    color: 'black',
    borderRadius: 5
  },
  toggleButton: {
    padding: 10,
    position: 'absolute',
    right: 5
  },
  toggleButtonImage: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    tintColor: '#808080'
  },
  resetButton: {
    width: '100%',
    backgroundColor: '#045D91',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  goBackButton: {
    marginTop: 15,
    alignItems: 'center'
  },
  goBackText: {
    fontSize: 14
  }
})

export default ForgotPassword
