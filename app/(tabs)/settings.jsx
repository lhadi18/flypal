import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal
} from 'react-native'
import {
  faUser,
  faBell,
  faUserGroup,
  faKey,
  faTrash,
  faChevronRight,
  faChevronLeft,
  faPen
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import StyledAirportSearch from '@/components/sign-up-airport-search'
import webSocketService from '@/services/utils/websocket-service'
import AirlineSearch from '@/components/sign-up-airline-search'
import eventEmitter from '@/services/utils/event-emitter'
import RNPickerSelect from 'react-native-picker-select'
import { getRoles } from '@/services/apis/user-api'
import { MaterialIcons } from '@expo/vector-icons'
import React, { useState, useEffect } from 'react'
import * as ImagePicker from 'expo-image-picker'
import * as SecureStore from 'expo-secure-store'
import * as FileSystem from 'expo-file-system'
import { useRouter } from 'expo-router'
import * as Device from 'expo-device'
import axios from 'axios'

const Settings = () => {
  const [currentScreen, setCurrentScreen] = useState('Settings')
  const [errorMessage, setErrorMessage] = useState('')
  const [firstNameError, setFirstNameError] = useState('')
  const [lastNameError, setLastNameError] = useState('')
  const [userDetails, setUserDetails] = useState({
    firstName: '',
    lastName: '',
    role: { value: '' },
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
  const [showModal, setShowModal] = useState(false) // Modal state
  const [image, setImage] = useState(
    userDetails.profilePicture || 'https://storage.googleapis.com/flypal/profile-pictures/default-profile-picture.jpg'
  )
  const [uploadingImage, setUploadingImage] = useState(false)
  const [isPickerOpen, setPickerOpen] = useState(false) // State for open/close

  const [error, setError] = useState('')
  const router = useRouter()

  const MAX_IMAGE_SIZE = 6 * 1024 * 1024

  const fetchUserDetails = async () => {
    setLoading(true)
    try {
      const userId = await SecureStore.getItemAsync('userId')
      const response = await axios.get(`https://flypal-server.click/api/users/getUserId`, {
        params: {
          userId
        }
      })
      setUserDetails(response.data)
      console.log(userDetails.role.value)
      setImage(
        response.data.profilePicture ||
          'https://storage.googleapis.com/flypal/profile-pictures/default-profile-picture.jpg'
      )
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
        setRoles(
          rolesData.map(role => ({
            label: role.value, // Display label for the role (e.g., "Captain")
            value: role.value, // The value of the role (e.g., "Captain")
            _id: role._id // Include the _id for updating the role
          }))
        )
        console.log(roles)
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

    if (!currentUserDetails.firstName || !currentUserDetails.lastName) {
      setErrorMessage('First name or last name is required')
      return
    } else if (currentUserDetails.firstName.length > 24 || currentUserDetails.lastName.length > 24) {
      setErrorMessage('First or last name should not be too long')
      return
    }

    setErrorMessage('') // Clear previous errors

    const updatedUserData = {
      userId: currentUserDetails.userId,
      firstName: currentUserDetails.firstName,
      lastName: currentUserDetails.lastName,
      email: currentUserDetails.email,
      role: currentUserDetails.role?._id || '',
      homebase: currentUserDetails.homebase,
      airline: currentUserDetails.airline
    }

    try {
      const response = await axios.put(
        `https://flypal-server.click/api/users/updateUserId/${currentUserDetails._id}`,
        updatedUserData
      )
      fetchUserDetails()
      setCurrentScreen('UserProfile')

      const newHomebaseTZ = response.data.homebase.tz_database
      eventEmitter.emit('homebaseUpdated', newHomebaseTZ)

      SecureStore.setItemAsync('homebaseTZDatabase', newHomebaseTZ)
    } catch (error) {
      console.error('Error updating user profile:', error)
    }
  }

  const handleChangePassword = async () => {
    if (password !== confirmNewPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setError(null)

    const userId = await SecureStore.getItemAsync('userId')
    const data = {
      password
    }

    try {
      const response = await axios.put(`https://flypal-server.click/api/users/updatePassword/${userId}`, data)
      console.log('Password updated:', response.data)
      setPassword('')
      setConfirmNewPassword('')
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
              await axios.delete(`https://flypal-server.click/api/users/deleteUser/${userId}`)
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
      const userId = await SecureStore.getItemAsync('userId')
      const deviceId = Device.osBuildId || Device.deviceName || 'unknown-device-id'

      await fetch('https://flypal-server.click/api/push-token/delete-device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, deviceId })
      })

      webSocketService.disconnect()

      await SecureStore.deleteItemAsync('userId')
      await SecureStore.deleteItemAsync('pushToken')
      router.replace('/sign-in')
    } catch (error) {
      console.error('Error during logout:', error)
    }
  }

  const closeModal = () => {
    setShowModal(false)
  }

  const handleEditProfilePicture = async () => {
    Alert.alert(
      'Edit Profile Picture',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: openCamera
        },
        {
          text: 'Choose from Gallery',
          onPress: openGallery
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ],
      { cancelable: true }
    )
  }

  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync()
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Camera access is required to take a photo.')
      return
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1
    })

    if (!result.canceled) {
      const imageSize = await getImageSize(result.assets[0].uri)
      if (imageSize > MAX_IMAGE_SIZE) {
        Alert.alert('Error', 'Image size exceeds the 6MB limit. Please select a smaller image.')
        return
      }
      setImage(result.assets[0].uri)
      updateProfilePicture(result.assets[0].uri)
    }
  }

  const openGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permissionResult.granted) {
      Alert.alert('Permission Denied', 'Gallery access is required to select a photo.')
      return
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1
    })

    if (!result.canceled) {
      const imageSize = await getImageSize(result.assets[0].uri)
      if (imageSize > MAX_IMAGE_SIZE) {
        Alert.alert('Error', 'Image size exceeds the 6MB limit. Please select a smaller image.')
        return
      }
      setImage(result.assets[0].uri)
      updateProfilePicture(result.assets[0].uri)
    }
  }

  const updateProfilePicture = async uri => {
    setShowModal(false)
    setUploadingImage(true)

    try {
      const userId = await SecureStore.getItemAsync('userId')
      const formData = new FormData()
      formData.append('profilePicture', {
        uri,
        type: 'image/jpeg',
        name: 'profile.jpg'
      })

      const response = await axios.put(
        `https://flypal-server.click/api/users/updateProfilePicture/${userId}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      )

      Alert.alert('Success', 'Profile picture updated successfully.')

      await fetchUserDetails()
    } catch (error) {
      console.error('Error updating profile picture:', error)
      Alert.alert('Error', 'Failed to update profile picture.')
    } finally {
      setUploadingImage(false)
    }
  }

  const getImageSize = async uri => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri)
      return fileInfo.size
    } catch (error) {
      console.error('Error getting file size:', error)
      return 0
    }
  }

  const renderSettings = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}></View>
      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={() => setShowModal(true)}>
          <Image style={styles.avatar} source={{ uri: image }} />
        </TouchableOpacity>
      </View>
      <View>
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
            <TouchableOpacity style={styles.button} onPress={() => router.push('/social?tab=connection')}>
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
      <Modal visible={showModal} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Image style={styles.modalImage} source={{ uri: image }} />
            <TouchableOpacity style={styles.editButtonModal} onPress={handleEditProfilePicture}>
              <FontAwesomeIcon icon={faPen} size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.modalClose} onPress={closeModal}>
            <Text style={styles.modalCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal animationType="fade" transparent={true} visible={uploadingImage} onRequestClose={() => {}}>
        <View style={styles.loadingModalOverlay}>
          <View style={styles.loadingModal}>
            <ActivityIndicator size="large" color="#FFF" />
            <Text style={styles.loadingText}>Uploading image, please wait...</Text>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )

  const renderUserProfile = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}></View>
      <View style={styles.avatarContainer}>
        <Image
          style={styles.avatar}
          source={{
            uri:
              userDetails.profilePicture ||
              'https://storage.googleapis.com/flypal/profile-pictures/default-profile-picture.jpg'
          }}
        />
      </View>
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
      <View style={styles.avatarContainer}>
        <Image
          style={styles.avatar}
          source={{
            uri:
              userDetails.profilePicture ||
              'https://storage.googleapis.com/flypal/profile-pictures/default-profile-picture.jpg'
          }}
        />
      </View>
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
              {errorMessage ? <Text style={{ color: 'red', marginBottom: 5 }}>{errorMessage}</Text> : null}
              <View style={styles.infoRow}>
                <Text style={styles.infoTitle}>E-mail Address</Text>
                <View style={styles.infoStyles}>
                  <Text style={{ color: 'grey' }}>{userDetails?.email || 'N/A'}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoTitle}>Role</Text>
                <View style={styles.pickerContainer}>
                  {loadingRoles ? (
                    <ActivityIndicator size="small" color="#0000ff" />
                  ) : (
                    <RNPickerSelect
                      onValueChange={value => {
                        const selectedRole = roles.find(role => role.value === value) || null
                        setCurrentUserDetails({
                          ...currentUserDetails,
                          role: selectedRole
                        })
                      }}
                      items={roles}
                      style={{
                        inputIOS: {
                          fontSize: 14,
                          paddingVertical: 12,
                          paddingHorizontal: 10,
                          borderWidth: 1,
                          borderColor: 'grey',
                          borderRadius: 5,
                          color: currentUserDetails?.role?.value ? 'black' : 'grey',
                          backgroundColor: 'white',
                          height: 40
                        },
                        inputAndroid: {
                          fontSize: 14,
                          paddingVertical: 12,
                          paddingHorizontal: 10,
                          borderWidth: 1,
                          borderColor: 'grey',
                          borderRadius: 5,
                          color: currentUserDetails?.role?.value ? 'black' : 'grey',
                          backgroundColor: 'white',
                          height: 40
                        },
                        placeholder: {
                          color: 'grey',
                          fontSize: 14
                        }
                      }}
                      placeholder={{
                        label: 'Select your role',
                        value: null,
                        color: 'grey'
                      }}
                      value={currentUserDetails?.role?.value || null}
                      useNativeAndroidPickerStyle={false}
                    />
                  )}
                  {currentUserDetails?.role === null && (
                    <Text style={{ color: 'red', marginTop: 5 }}>Role must not be empty</Text>
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
                {currentUserDetails.homebase === '' && (
                  <Text style={{ color: 'red', marginTop: 5 }}>Homebase must not be empty</Text>
                )}
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
                {currentUserDetails.airline === '' && (
                  <Text style={{ color: 'red', marginTop: 5 }}>Airline must not be empty</Text>
                )}
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
    fontSize: 14
  }
})

const styles = StyleSheet.create({
  roleField: {
    width: '100%',
    backgroundColor: 'white',
    color: 'black',
    borderRadius: 5,
    borderColor: '#ADADAD',
    borderWidth: 1
  },
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
  viewAvatar: {
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
    marginTop: 20
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
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center', // Ensure the container centers the avatar vertically
    marginTop: -50, // Adjust this if necessary to properly position the avatar
    zIndex: 1,
    width: '100%' // Ensure the container spans the full width
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    borderColor: 'white',
    alignSelf: 'center' // Ensure the avatar centers itself inside the container
  },

  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)'
  },
  modalContent: {
    alignItems: 'center',
    position: 'relative'
  },
  modalImage: {
    width: 300,
    height: 300,
    resizeMode: 'contain',
    borderRadius: 10
  },
  editButtonModal: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#045D91',
    borderRadius: 20,
    padding: 10
  },
  modalClose: {
    marginTop: 20,
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10
  },
  modalCloseText: {
    color: '#045D91',
    fontWeight: 'bold'
  },
  loadingModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(128, 128, 128, 0.5)'
  },
  loadingModal: {
    width: 220,
    padding: 20,
    backgroundColor: '#333',
    borderRadius: 12,
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 10,
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center'
  }
})

export default Settings
