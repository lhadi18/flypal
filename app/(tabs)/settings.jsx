import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert
} from 'react-native'
import {
  faUser,
  faBell,
  faUserGroup,
  faKey,
  faTrash,
  faChevronRight,
  faChevronLeft
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import StyledAirportSearch from '@/components/sign-up-airport-search'
import AirlineSearch from '@/components/sign-up-airline-search'
import RNPickerSelect from 'react-native-picker-select'
import { getRoles } from '@/services/apis/user-api'
import React, { useState, useEffect } from 'react'
import * as SecureStore from 'expo-secure-store'
import { ROLES } from '../../constants/roles'
import { useRouter } from 'expo-router'
import axios from 'axios'

const Settings = () => {
  const [currentScreen, setCurrentScreen] = useState('Settings')
  const [userDetails, setUserDetails] = useState({
    firstName: '',
    lastName: '',
    role: '',
    homebase: { IATA: '', city: '', ICAO: '' },
    airline: { ICAO: '', Name: '' },
    email: ''
  })
  const [loading, setLoading] = useState(true)
  const [currentUserDetails, setCurrentUserDetails] = useState(null)
  const [oldPasswordVisible, setOldPasswordVisible] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [password, setPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [roles, setRoles] = useState([])
  const [loadingRoles, setLoadingRoles] = useState(true) // Optional: loading state for roles

  const [error, setError] = useState('')
  const router = useRouter()

  const fetchUserDetails = async () => {
    setLoading(true)
    try {
      const userId = await SecureStore.getItemAsync('userId')
      console.log(userId)
      const response = await axios.get(`https://64f6-103-18-0-20.ngrok-free.app/api/users/getUserId`, {
        params: {
          userId
        }
      })
      setUserDetails(response.data)
      console.log('Response Data:', response.data)
    } catch (error) {
      console.error('Error fetching user details:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserDetails()
  }, [])

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoadingRoles(true)
        const rolesData = await getRoles()
        setRoles(rolesData.map(role => ({ label: role.value, value: role._id })))
      } catch (error) {
        console.error('Error fetching roles:', error)
      } finally {
        setLoadingRoles(false)
      }
    }

    fetchRoles()
  }, [])

  const handleEditUserDetails = () => {
    setCurrentUserDetails(userDetails)
    setCurrentScreen('EditProfile')
  }

  const updateUserDetails = async () => {
    if (!currentUserDetails) {
      console.error('No user details available to update')
      return
    }

    const updatedUserData = {
      userId: currentUserDetails.userId,
      firstName: currentUserDetails.firstName,
      lastName: currentUserDetails.lastName,
      email: currentUserDetails.email,
      role: currentUserDetails.role?.value || '',
      homebase: currentUserDetails.homebase,
      airline: currentUserDetails.airline
    }

    console.log('Updated user data to be sent:', updatedUserData)

    try {
      const response = await axios.put(
        `https://64f6-103-18-0-20.ngrok-free.app/api/users/updateUserId/${currentUserDetails._id}`,
        updatedUserData
      )
      console.log('User profile updated:', response.data)
      // handleEditUserDetails(response.data);
      fetchUserDetails()
      setCurrentScreen('UserProfile')
    } catch (error) {
      console.error('Error updating user profile:', error)
    }
  }

  const handleChangePassword = async () => {
    if (password !== confirmNewPassword) {
      setError('Passwords do not match')
      return
    }

    const userId = await SecureStore.getItemAsync('userId')
    const data = {
      password
    }

    try {
      const response = await axios.put(
        `https://64f6-103-18-0-20.ngrok-free.app/api/users/updatePassword/${userId}`,
        data
      )
      console.log('Password updated:', response.data)
      Alert.alert('Password updated successfully!')
      setCurrentScreen('Settings')
    } catch (error) {
      setError('Failed to update password')
      console.error(error)
    }
  }

  const deleteUserAccount = userId => {
    Alert.alert(
      'Confirm Delete',
      'Do you want to delete this account?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await axios.delete(`https://64f6-103-18-0-20.ngrok-free.app/api/users/deleteUser/${userId}`)
              router.push('/sign-in')
            } catch (error) {
              console.error('Error deleting account:', error)
            }
          }
        }
      ],
      { cancelable: true }
    )
  }

  const handleLogout = async () => {
    try {
      await SecureStore.deleteItemAsync('userId')
      router.push('/sign-in')
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const renderSettings = () => (
    <View style={styles.container}>
      <View style={styles.header}></View>
      <Image style={styles.avatar} source={{ uri: 'https://bootdey.com/img/Content/avatar/avatar6.png' }} />
      <View style={styles.body}>
        <View style={styles.bodyContent}>
          <Text style={styles.name}>
            {userDetails?.firstName} {userDetails?.lastName}
          </Text>
          <Text style={styles.info}>Homebase</Text>
          <Text style={styles.homebase}>
            {userDetails.homebase?.IATA} - {userDetails.homebase?.city}
          </Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={() => setCurrentScreen('UserProfile')}>
              <View style={styles.buttonContent}>
                <FontAwesomeIcon icon={faUser} style={styles.icon} />
                <Text style={styles.textButton}>User Profile</Text>
              </View>
              <FontAwesomeIcon icon={faChevronRight} style={styles.iconRight} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => router.push('reminder/reminder-settings')}>
              <View style={styles.buttonContent}>
                <FontAwesomeIcon icon={faBell} style={styles.icon} />
                <Text style={styles.textButton}>Reminders</Text>
              </View>
              <FontAwesomeIcon icon={faChevronRight} style={styles.iconRight} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.button}>
              <View style={styles.buttonContent}>
                <FontAwesomeIcon icon={faUserGroup} style={styles.icon} />
                <Text style={styles.textButton}>Connections</Text>
              </View>
              <FontAwesomeIcon icon={faChevronRight} style={styles.iconRight} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => setCurrentScreen('ChangePassword')}>
              <View style={styles.buttonContent}>
                <FontAwesomeIcon icon={faKey} style={styles.icon} />
                <Text style={styles.textButton}>Change Password</Text>
              </View>
              <FontAwesomeIcon icon={faChevronRight} style={styles.iconRight} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => deleteUserAccount(userDetails._id)}>
              <View style={styles.buttonContent}>
                <FontAwesomeIcon icon={faTrash} style={styles.iconDelete} />
                <Text style={styles.deleteButton}>Delete Account</Text>
              </View>
              <FontAwesomeIcon icon={faChevronRight} style={styles.iconDeleteRight} />
            </TouchableOpacity>
          </View>
          <View style={styles.logout}>
            <TouchableOpacity style={styles.button} onPress={handleLogout}>
              <View style={styles.buttonContent}>
                <Text style={styles.textButton}>Logout</Text>
              </View>
              <FontAwesomeIcon icon={faChevronRight} style={styles.iconRight} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  )

  const renderUserProfile = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}></View>
      <Image style={styles.avatar} source={{ uri: 'https://bootdey.com/img/Content/avatar/avatar6.png' }} />
      <View style={styles.bodyProfile}>
        <View style={styles.boxProfile}>
          <View style={styles.headerProfile}>
            <Text style={styles.headerText}>User Profile</Text>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (
            <View style={styles.infoContainer}>
              <View style={styles.infoItem}>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoTitle}>First Name</Text>
                  <View style={styles.infoStyles}>
                    <Text style={styles.infoValue}>{userDetails?.firstName || 'N/A'}</Text>
                  </View>
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoTitle}>Last Name</Text>
                  <View style={styles.infoStyles}>
                    <Text style={styles.infoValue}>{userDetails?.lastName || 'N/A'}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoTitle}>E-mail Address</Text>
                <View style={styles.infoStyles}>
                  <Text style={styles.infoValue}>{userDetails?.email || 'N/A'}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoTitle}>Role</Text>
                <View style={styles.infoStyles}>
                  <Text style={styles.infoValue}>{userDetails?.role?.value || 'N/A'}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoTitle}>Homebase</Text>
                <View style={styles.infoStyles}>
                  <Text style={styles.infoValue}>
                    {userDetails.homebase
                      ? `${userDetails.homebase?.IATA}/${userDetails.homebase?.ICAO} - ${userDetails.homebase?.city}`
                      : 'N/A'}
                  </Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoTitle}>Airline</Text>
                <View style={styles.infoStyles}>
                  <Text style={styles.infoValue}>
                    {userDetails.airline ? `${userDetails.airline.ICAO} - ${userDetails.airline.Name}` : 'N/A'}
                  </Text>
                </View>
              </View>
              <View style={styles.buttonEdit}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setCurrentScreen('Settings')}>
                  <Text style={styles.cancelText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.editButton} onPress={handleEditUserDetails}>
                  <Text style={styles.editText}>Edit Profile</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  )

  const renderEditProfile = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}></View>
      <Image style={styles.avatar} source={{ uri: 'https://bootdey.com/img/Content/avatar/avatar6.png' }} />
      <View style={styles.bodyProfile}>
        <View style={styles.boxProfile}>
          <View style={styles.headerProfile}>
            <Text style={styles.headerText}>Edit User Profile</Text>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (
            <View style={styles.infoContainer}>
              <View style={styles.infoItem}>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoTitle}>First Name</Text>
                  <TextInput
                    style={styles.infoStyles}
                    value={currentUserDetails?.firstName || ''}
                    onChangeText={text => setCurrentUserDetails({ ...currentUserDetails, firstName: text })}
                  />
                </View>
                <View style={styles.infoColumn}>
                  <Text style={styles.infoTitle}>Last Name</Text>
                  <TextInput
                    style={styles.infoStyles}
                    value={currentUserDetails?.lastName || ''}
                    onChangeText={text => setCurrentUserDetails({ ...currentUserDetails, lastName: text })}
                  />
                </View>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoTitle}>E-mail Address</Text>
                <View style={styles.infoStyles}>
                  <Text style={{ color: 'grey' }}>{userDetails?.email || 'N/A'}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoTitle}>Role</Text>
                <View>
                  {loadingRoles ? (
                    <ActivityIndicator size="small" color="#0000ff" />
                  ) : (
                    <RNPickerSelect
                      style={pickerSelectStyles}
                      onValueChange={value => {
                        const selectedRole = roles.find(role => role.value === value)
                        setCurrentUserDetails({ ...currentUserDetails, role: selectedRole })
                      }}
                      items={roles}
                      value={currentUserDetails?.role?.value || ''}
                      placeholder={{
                        label: 'Select your role',
                        value: null,
                        color: 'grey'
                      }}
                    />
                  )}
                </View>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoTitle}>Homebase</Text>
                <View>
                  <StyledAirportSearch
                    placeholder={`${currentUserDetails.homebase?.IATA}/${currentUserDetails.homebase?.ICAO} - ${currentUserDetails.homebase?.city}`}
                    onSelect={airport =>
                      setCurrentUserDetails({ ...currentUserDetails, homebase: airport ? airport.id : '' })
                    }
                    value={currentUserDetails.homebase}
                  />
                </View>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoTitle}>Airline</Text>
                <View>
                  <AirlineSearch
                    placeholder={`${currentUserDetails.airline?.ICAO} - ${currentUserDetails.airline?.Name}`}
                    onSelect={airline =>
                      setCurrentUserDetails({ ...currentUserDetails, airline: airline ? airline.id : '' })
                    } // Use airline ID
                    value={userDetails.airline}
                  />
                </View>
              </View>
              <View style={styles.buttonEdit}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setCurrentScreen('UserProfile')}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.editButton} onPress={updateUserDetails}>
                  <Text style={styles.editText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  )

  const renderEditPassword = () => (
    <ScrollView style={styles.container}>
      <View style={styles.bodyProfile}>
        <View style={styles.boxProfile}>
          <View style={styles.headerProfile}>
            <Text style={styles.headerText}>User Profile</Text>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (
            <View style={styles.infoContainer}>
              <View style={styles.infoRow}>
                <Text style={styles.infoTitle}>New Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.passwordInput, { paddingRight: 40 }]}
                    placeholder="Enter new password"
                    placeholderTextColor="grey"
                    secureTextEntry={!passwordVisible}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity style={styles.toggleButton} onPress={() => setPasswordVisible(!passwordVisible)}>
                    <Image
                      source={
                        passwordVisible
                          ? require('../../assets/icons/pass-show.png')
                          : require('../../assets/icons/pass-hide.png')
                      }
                      style={styles.toggleButtonImage}
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoTitle}>Confirm New Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.passwordInput, { paddingRight: 40 }]}
                    placeholder="Enter confirm new password"
                    placeholderTextColor="grey"
                    secureTextEntry={!confirmPasswordVisible}
                    value={confirmNewPassword}
                    onChangeText={setConfirmNewPassword}
                  />
                  <TouchableOpacity
                    style={styles.toggleButton}
                    onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                  >
                    <Image
                      source={
                        confirmPasswordVisible
                          ? require('../../assets/icons/pass-show.png')
                          : require('../../assets/icons/pass-hide.png')
                      }
                      style={styles.toggleButtonImage}
                    />
                  </TouchableOpacity>
                </View>
              </View>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <View style={styles.buttonEdit}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setCurrentScreen('Settings')}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.editButton} onPress={handleChangePassword}>
                  <Text style={styles.editText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  )

  return (
    <>
      {currentScreen === 'Settings' && renderSettings()}
      {currentScreen === 'UserProfile' && renderUserProfile()}
      {currentScreen === 'EditProfile' && renderEditProfile()}
      {currentScreen === 'ChangePassword' && renderEditPassword()}
    </>
  )
}
const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: 'grey',
    borderRadius: 5,
    color: 'black',
    paddingRight: 30,
    backgroundColor: 'white',
    height: 40
  },
  inputAndroid: {
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: 'grey',
    borderRadius: 5,
    color: 'black',
    paddingRight: 30,
    backgroundColor: 'white',
    height: 40
  },
  placeholder: {
    color: 'grey',
    fontSize: 14 // matching the text size
  }
})

const styles = StyleSheet.create({
  logout: {
    marginTop: 30
  },
  error: {
    color: 'red',
    marginBottom: 10
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 5,
    borderColor: 'grey',
    paddingHorizontal: 10,
    backgroundColor: 'white',
    height: 40
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 5,
    color: 'black'
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
  header: {
    backgroundColor: '#538FC7',
    height: 150
  },
  box: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderColor: '#4386AD',
    borderWidth: 1,
    shadowColor: '#000',
    marginHorizontal: 20,
    padding: 10,
    marginBottom: 20,
    shadowOpacity: 0.25,
    shadowOffset: { width: 2, height: 4 }
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 63,
    borderWidth: 4,
    borderColor: 'white',
    marginBottom: 10,
    alignSelf: 'center',
    position: 'absolute',
    marginTop: 70
  },
  body: {
    marginTop: 50
  },
  bodyProfile: {
    marginTop: 70
  },
  bodyContent: {
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 10
  },
  name: {
    fontSize: 18,
    color: '#000',
    fontWeight: '600'
  },
  info: {
    fontSize: 12,
    color: '#000',
    fontWeight: '600'
  },
  homebase: {
    fontSize: 12,
    color: '#555555',
    textAlign: 'center'
  },
  button: {
    height: 50,
    flexDirection: 'row',
    paddingLeft: 20,
    alignItems: 'center',
    borderRadius: 5,
    borderBottomColor: '#FFF',
    borderBottomWidth: 1,
    width: 350,
    backgroundColor: '#045D91',
    justifyContent: 'space-between',
    paddingHorizontal: 20
  },
  buttonContainer: {
    marginTop: 20
  },
  buttonEdit: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  textButton: {
    fontSize: 16,
    color: '#FFF'
  },
  deleteButton: {
    fontSize: 16,
    color: '#FF0000'
  },
  icon: {
    color: '#FFF',
    paddingRight: 20,
    height: 16,
    width: 16,
    marginRight: 10
  },
  iconDelete: {
    color: '#FF0000',
    paddingRight: 20,
    height: 16,
    width: 16,
    marginRight: 10
  },
  iconRight: {
    marginLeft: 'auto',
    color: '#FFF'
  },
  iconDeleteRight: {
    marginLeft: 'auto',
    color: '#FF0000'
  },
  backButton: {
    marginTop: 10,
    marginLeft: 10
  },
  boxProfile: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderColor: '#4386AD',
    borderWidth: 1,
    shadowColor: '#000',
    marginHorizontal: 20,
    marginBottom: 20,
    shadowOpacity: 0.25,
    shadowOffset: { width: 2, height: 4 }
  },
  headerProfile: {
    backgroundColor: '#045D91',
    padding: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    alignItems: 'center'
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold'
  },
  infoContainer: {
    margin: 20
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 10
  },
  infoColumn: {
    flex: 1,
    paddingRight: 10
  },
  infoRow: {
    flexDirection: 'column',
    paddingRight: 10,
    marginBottom: 10
  },
  infoTitle: {
    fontWeight: 'bold',
    marginBottom: 5
  },
  infoStyles: {
    width: '100%',
    height: 40,
    padding: 10,
    marginVertical: 5,
    backgroundColor: 'white',
    color: 'black',
    borderRadius: 5,
    borderColor: '#ADADAD',
    borderWidth: 1
  },
  editButton: {
    backgroundColor: '#045D91',
    borderRadius: 10,
    width: '45%',
    marginHorizontal: 5,
    padding: 8
  },
  editText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center'
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderColor: '#656565',
    borderWidth: 1,
    borderRadius: 10,
    width: '45%',
    marginHorizontal: 5,
    padding: 5
  },
  cancelText: {
    color: '#656565',
    fontWeight: '600',
    textAlign: 'center'
  }
})

export default Settings
