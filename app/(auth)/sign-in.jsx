import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ImageBackground } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScrollView } from 'react-native'
import React, { useState } from 'react'
import { Formik } from 'formik'
import * as Yup from 'yup'

const SignIn = () => {
  const [passwordVisible, setPasswordVisible] = useState(false)

  const validationSchema = Yup.object().shape({
    email: Yup.string().email('Invalid email').required('Email is required'),
    password: Yup.string().required('Password is required')
  })

  return (
    <ImageBackground source={require('../../assets/images/landing-background.jpeg')} style={styles.background}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.overlay} />
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.container}>
            <View style={styles.logoContainer}>
              <Image source={require('../../assets/images/flypal-logo.png')} style={styles.logo} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.loginText}>Login</Text>
              <Text style={styles.subtitleText}>Welcome back, flight crew.</Text>
            </View>

            <Formik
              initialValues={{ email: '', password: '' }}
              validationSchema={validationSchema}
              onSubmit={values => {
                console.log(values)
                // Handle login
              }}
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                <View style={styles.formContainer}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Email</Text>
                    <View style={styles.emailContainer}>
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your email"
                        placeholderTextColor="grey"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        onChangeText={handleChange('email')}
                        onBlur={handleBlur('email')}
                        value={values.email}
                      />
                    </View>
                    {touched.email && errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Password</Text>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        style={[styles.passwordInput, { paddingRight: 40 }]}
                        placeholder="Enter your password"
                        placeholderTextColor="grey"
                        secureTextEntry={!passwordVisible}
                        onChangeText={handleChange('password')}
                        onBlur={handleBlur('password')}
                        value={values.password}
                      />
                      <TouchableOpacity
                        style={styles.toggleButton}
                        onPress={() => setPasswordVisible(!passwordVisible)}
                      >
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
                    {touched.password && errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                    <TouchableOpacity style={styles.forgotPasswordButton}>
                      <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={styles.loginButton} onPress={handleSubmit}>
                    <Text style={styles.loginButtonText}>Login</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Formik>

            <View style={styles.registerContainer}>
              <Text style={styles.registerPrompt}>Don't have an account? </Text>
              <TouchableOpacity
                onPress={() => {
                  // Handle navigation to Register screen
                }}
              >
                <Text style={styles.registerText}>Register</Text>
              </TouchableOpacity>
            </View>
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
    flexGrow: 1,
    justifyContent: 'center'
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.6)'
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    marginTop: -70
  },
  logoContainer: {
    marginBottom: 20
  },
  logo: {
    width: 120,
    height: 120,
    resizeMode: 'contain'
  },
  loginText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4
  },
  subtitleText: {
    fontSize: 18,
    marginBottom: 30,
    color: 'grey',
    textAlign: 'left'
  },
  textContainer: {
    width: '95%',
    marginBottom: 5
  },
  formContainer: {
    width: '95%',
    alignContent: 'center',
    alignItems: 'center'
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
  passwordInput: {
    flex: 1,
    height: '100%',
    backgroundColor: 'white',
    paddingHorizontal: 10,
    color: 'black',
    borderRadius: 5
  },
  inputContainer: {
    width: '100%',
    marginBottom: 15
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#636363'
  },
  loginButton: {
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
    marginTop: 50
  },
  loginButtonText: {
    color: 'white',
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  registerContainer: {
    flexDirection: 'row',
    marginTop: 20
  },
  registerPrompt: {
    fontSize: 14
  },
  registerText: {
    color: '#045D91',
    fontSize: 14,
    fontWeight: 'bold'
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 5,
    backgroundColor: 'white',
    height: 40,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 5,
    borderColor: 'grey',
    backgroundColor: 'white',
    height: 40,
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
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginTop: 10
  },
  forgotPasswordText: {
    color: '#045D91',
    fontSize: 14,
    fontWeight: 'bold'
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 7
  }
})

export default SignIn
