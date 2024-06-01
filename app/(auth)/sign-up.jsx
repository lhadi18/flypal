import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ImageBackground } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ScrollView } from 'react-native'
import React, { useState } from 'react'
import { Formik } from 'formik'
import * as Yup from 'yup'

const SignUp = () => {
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false)

  const validationSchema = Yup.object().shape({
    firstName: Yup.string().required('First Name is required'),
    lastName: Yup.string().required('Last Name is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Confirm Password is required')
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
              <Text style={styles.createAccountText}>Create an account</Text>
              <Text style={styles.subtitleText}>Flight Crew Personal Assistant</Text>
            </View>

            <Formik
              initialValues={{
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                confirmPassword: ''
              }}
              validationSchema={validationSchema}
              onSubmit={values => {
                console.log(values)
                // Handle registration logic
              }}
            >
              {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                <View style={styles.formContainer}>
                  <View style={styles.nameContainer}>
                    <View style={[styles.inputContainer, styles.halfInputContainer]}>
                      <Text style={styles.label}>First Name</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="First Name"
                        placeholderTextColor="grey"
                        onChangeText={handleChange('firstName')}
                        onBlur={handleBlur('firstName')}
                        value={values.firstName}
                      />
                      <View style={styles.errorContainer}>
                        {touched.firstName && errors.firstName && (
                          <Text style={styles.errorText}>{errors.firstName}</Text>
                        )}
                      </View>
                    </View>
                    <View style={[styles.inputContainer, styles.halfInputContainerLast]}>
                      <Text style={styles.label}>Last Name</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Last Name"
                        placeholderTextColor="grey"
                        onChangeText={handleChange('lastName')}
                        onBlur={handleBlur('lastName')}
                        value={values.lastName}
                      />
                      <View style={styles.errorContainer}>
                        {touched.lastName && errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
                      </View>
                    </View>
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Email</Text>
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
                    <View style={styles.errorContainer}>
                      {touched.email && errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                    </View>
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
                    <View style={styles.errorContainer}>
                      {touched.password && errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
                    </View>
                  </View>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <View style={styles.passwordContainer}>
                      <TextInput
                        style={[styles.passwordInput, { paddingRight: 40 }]}
                        placeholder="Confirm your password"
                        placeholderTextColor="grey"
                        secureTextEntry={!confirmPasswordVisible}
                        onChangeText={handleChange('confirmPassword')}
                        onBlur={handleBlur('confirmPassword')}
                        value={values.confirmPassword}
                      />
                      <TouchableOpacity
                        style={styles.toggleButton}
                        onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                      >
                        <Image
                          source={
                            confirmPasswordVisible
                              ? require('../../assets/icons/pass-hide.png')
                              : require('../../assets/icons/pass-show.png')
                          }
                          style={styles.toggleButtonImage}
                        />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.errorContainer}>
                      {touched.confirmPassword && errors.confirmPassword && (
                        <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity style={styles.registerButton} onPress={handleSubmit}>
                    <Text style={styles.registerButtonText}>Register</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Formik>

            <View style={styles.loginContainer}>
              <Text style={styles.loginPrompt}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => {
                  /* Handle navigation to Login screen */
                }}
              >
                <Text style={styles.loginText}>Login</Text>
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
    marginTop: -30
  },
  logoContainer: {
    marginBottom: 20
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain'
  },
  textContainer: {
    width: '95%',
    alignItems: 'left'
  },
  createAccountText: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 4
  },
  subtitleText: {
    fontSize: 16,
    color: 'grey',
    marginBottom: 30,
    textAlign: 'left'
  },
  formContainer: {
    width: '95%',
    alignContent: 'center',
    alignItems: 'center'
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%'
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
  halfInputContainer: {
    flex: 1,
    marginRight: 10
  },
  halfInputContainerLast: {
    flex: 1
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    backgroundColor: 'white',
    color: 'black'
  },
  inputContainer: {
    width: '100%'
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#636363'
  },
  registerButton: {
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
    marginTop: 10
  },
  registerButtonText: {
    color: 'white',
    fontFamily: 'Roboto-Regular',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  loginContainer: {
    flexDirection: 'row',
    marginTop: 20
  },
  loginPrompt: {
    fontSize: 14
  },
  loginText: {
    color: '#045D91',
    fontSize: 14,
    fontWeight: 'bold'
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 5,
    borderColor: 'grey',
    backgroundColor: 'white',
    height: 40,
    paddingHorizontal: 10
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
  errorContainer: {
    height: 20,
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 4
  },
  errorText: {
    color: 'red',
    fontSize: 12
  }
})

export default SignUp
