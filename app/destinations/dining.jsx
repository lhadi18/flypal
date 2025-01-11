import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  TextInput,
  Button,
  Linking,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native'
import {
  fetchNearbyPlaces,
  saveRecommendation,
  fetchCrewPicks,
  likeRecommendation
} from '../../services/apis/destination-api'
import NonInteractableStarRating from '@/components/noninteractable-star-rating'
import InteractableStarRating from '@/components/interactable-star-rating'
import DietaryFilterModal from '@/components/dietary-filter-modal'
import { MaterialIcons, FontAwesome } from '@expo/vector-icons'
import { dietaryOptions } from '@/constants/dietary-options'
import { useGlobalStore } from '../../store/store'
import React, { useState, useEffect } from 'react'
import * as SecureStore from 'expo-secure-store'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import icons from '../../constants/icons'
import { BlurView } from 'expo-blur'
import { Formik } from 'formik'
import * as Yup from 'yup'

const PLACEHOLDER_IMAGE_URL = '../../assets/images/no-image.png'
const NO_CREW_PICKS_IMAGE = require('../../assets/images/no-crew-picks.jpg')

const Dining = () => {
  const [isFilterModalVisible, setFilterModalVisible] = useState(false)
  const [selectedDietaryOption, setSelectedDietaryOption] = useState(null)
  const [loadingCrewPicks, setLoadingCrewPicks] = useState(false)
  const [selectedTab, setSelectedTab] = useState('Our Picks')
  const [places, setPlaces] = useState([])
  const [crewPicks, setCrewPicks] = useState([])
  const [bookmarks, setBookmarks] = useState([])
  const [hasFetchedPlaces, setHasFetchedPlaces] = useState(false)
  const [hasFetchedCrewPicks, setHasFetchedCrewPicks] = useState(false)
  const [postModalVisible, setPostModalVisible] = useState(false)
  const [image, setImage] = useState(null)
  const [isImageModalVisible, setImageModalVisible] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [loading, setLoading] = useState(false)

  const selectedAirport = useGlobalStore(state => state.selectedAirport)

  // Fetch bookmarks once on component mount
  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const userId = await SecureStore.getItemAsync('userId')
        const response = await fetch(`https://flypal-server.click/api/bookmarks/user/${userId}`)
        if (response.ok) {
          const userBookmarks = await response.json()
          const bookmarkedIds = userBookmarks.map(b => b.diningId)
          setBookmarks(bookmarkedIds)
        }
      } catch (error) {
        console.error('Failed to fetch bookmarks:', error)
      }
    }
    fetchBookmarks()
  }, [])

  useEffect(() => {
    const fetchDiningData = async () => {
      if (selectedTab === 'Our Picks' && selectedAirport && !hasFetchedPlaces) {
        try {
          const nearbyPlaces = await fetchNearbyPlaces(
            selectedAirport.city_latitude,
            selectedAirport.city_longitude,
            selectedAirport.city,
            selectedDietaryOption || null
          )
          const updatedPlaces = nearbyPlaces.map(place => ({
            ...place,
            bookmarked: bookmarks.includes(place.place_id)
          }))
          setPlaces(updatedPlaces)
          setHasFetchedPlaces(true)
        } catch (error) {
          console.error('Failed to fetch places:', error)
        }
      } else if (selectedTab === 'Crew Picks' && selectedAirport && !hasFetchedCrewPicks) {
        try {
          const userId = await SecureStore.getItemAsync('userId')
          const crewData = await fetchCrewPicks(
            selectedAirport.objectId || selectedAirport.id || selectedAirport.value,
            selectedDietaryOption
          )

          const updatedCrewPicks = crewData.map(pick => ({
            ...pick,
            bookmarked: bookmarks.includes(pick._id),
            userHasLiked: pick.likedBy.includes(userId)
          }))

          setCrewPicks(updatedCrewPicks)
          setHasFetchedCrewPicks(true)
        } catch (error) {
          console.error('Failed to fetch crew picks:', error)
        }
      }
    }

    if ((selectedTab === 'Our Picks' && !hasFetchedPlaces) || (selectedTab === 'Crew Picks' && !hasFetchedCrewPicks)) {
      fetchDiningData()
    }
  }, [selectedTab, selectedAirport, hasFetchedPlaces, hasFetchedCrewPicks, selectedDietaryOption])

  const toggleBookmark = async (
    id,
    sourceType,
    restaurantName,
    location,
    imageUrl,
    rating,
    totalReviews,
    latitude,
    longitude
  ) => {
    try {
      const userId = await SecureStore.getItemAsync('userId')
      const isBookmarked = bookmarks.includes(id)
      const endpoint = isBookmarked ? 'unbookmark' : 'bookmark'

      const requestBody = {
        userId,
        diningId: id,
        sourceType,
        name: restaurantName,
        location,
        imageUrl,
        rating,
        totalReviews,
        latitude,
        longitude,
        airportId: selectedAirport.objectId || selectedAirport.id || selectedAirport.value
      }

      await fetch(`https://flypal-server.click/api/bookmarks/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      const updatedBookmarks = isBookmarked ? bookmarks.filter(bid => bid !== id) : [...bookmarks, id]
      setBookmarks(updatedBookmarks)

      // Update places
      setPlaces(prevPlaces =>
        prevPlaces.map(place => (place.place_id === id ? { ...place, bookmarked: !isBookmarked } : place))
      )

      // Update crewPicks, preserving the like status
      setCrewPicks(prevCrewPicks =>
        prevCrewPicks.map(pick =>
          pick._id === id
            ? {
                ...pick,
                bookmarked: !isBookmarked,
                userHasLiked: pick.userHasLiked // Preserve like status
              }
            : pick
        )
      )
    } catch (error) {
      console.error('Failed to update bookmark:', error)
    }
  }

  const openImagePicker = async setFieldValue => {
    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: () => takePhoto(setFieldValue)
        },
        {
          text: 'Choose from Library',
          onPress: () => pickImage(setFieldValue)
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ],
      { cancelable: true }
    )
  }

  const pickImage = async setFieldValue => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1
    })

    if (!result.canceled) {
      setImage(result.assets[0].uri)
      setFieldValue('image', result.assets[0].uri)
    }
  }

  const takePhoto = async setFieldValue => {
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1
    })

    if (!result.canceled) {
      setImage(result.assets[0].uri)
      setFieldValue('image', result.assets[0].uri)
    }
  }

  const handleSaveRecommendation = async (values, { resetForm }) => {
    setLoading(true)
    const data = {
      restaurantName: values.restaurantName,
      location: values.location,
      review: values.review,
      rating: values.rating,
      tags: values.tags,
      airportId: selectedAirport.objectId || selectedAirport.id,
      image: values.image
    }

    if (data.image) {
      const imageSizeLimit = 8 * 1024 * 1024 // 8 MB image
      const imageInfo = await FileSystem.getInfoAsync(data.image)
      if (imageInfo.size > imageSizeLimit) {
        Alert.alert('Image Size Exceeded', 'Please select an image smaller than 8 MB.')
        setLoading(false)
        return
      }
    }

    try {
      await saveRecommendation(data)
      console.log('Dining recommendation added successfully')
      fetchCrewPicks(selectedAirport.objectId || selectedAirport.id).then(data => setCrewPicks(data)) // Refresh Crew Picks
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setPostModalVisible(false)
      resetForm()
      setImage(null)
      setSelectedDietaryOption(null)
      setLoading(false)
    }
  }

  const openImageModal = imageUri => {
    setSelectedImage(imageUri)
    setImageModalVisible(true)
  }

  const handleLike = async id => {
    try {
      const userId = await SecureStore.getItemAsync('userId')
      const updatedPick = await likeRecommendation(id, userId)

      setCrewPicks(prevCrewPicks =>
        prevCrewPicks.map(pick =>
          pick._id === id
            ? {
                ...updatedPick,
                bookmarked: bookmarks.includes(updatedPick._id)
              }
            : pick
        )
      )
    } catch (error) {
      console.error('Failed to update likes:', error)
    }
  }

  const openInGoogleMaps = (latitude, longitude) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
    Linking.openURL(url)
  }

  const handleSelectOption = option => {
    setSelectedDietaryOption(option)
  }

  const handleModalClose = () => {
    setFilterModalVisible(false)
    setHasFetchedPlaces(false)
    setHasFetchedCrewPicks(false)
  }

  const validationSchema = Yup.object().shape({
    restaurantName: Yup.string().required('Restaurant Name is required'),
    location: Yup.string().required('Location is required'),
    review: Yup.string().required('Review is required'),
    rating: Yup.number().min(1, 'Rating is required').max(5, 'Rating must be at most 5').required('Rating is required'),
    image: Yup.string().required('Image is required')
  })

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.header}>
            <View style={styles.tabContainer}>
              <TouchableOpacity onPress={() => setSelectedTab('Our Picks')}>
                <Text style={[styles.tabText, selectedTab === 'Our Picks' && styles.activeTabText]}>Our Picks</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setSelectedTab('Crew Picks')}>
                <Text style={[styles.tabText, selectedTab === 'Crew Picks' && styles.activeTabText]}>Crew Picks</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.iconContainer}>
              <TouchableOpacity style={styles.icon} onPress={() => setFilterModalVisible(true)}>
                <MaterialIcons name="filter-list" size={24} color="#4386AD" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.icon} onPress={() => setPostModalVisible(true)}>
              <MaterialIcons name="post-add" size={24} color="#4386AD" />
            </TouchableOpacity>
          </View>

          <DietaryFilterModal
            isVisible={isFilterModalVisible}
            onClose={handleModalClose}
            selectedOption={selectedDietaryOption}
            onSelectOption={handleSelectOption}
          />
          <Modal
            animationType="slide"
            transparent={true}
            visible={postModalVisible}
            onRequestClose={() => {
              setPostModalVisible(false)
              setImage(null)
              setSelectedDietaryOption(null)
            }}
          >
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
              <BlurView intensity={50} style={styles.blurView}>
                <View style={styles.postModalView}>
                  <ScrollView contentContainerStyle={[styles.formContainer, { paddingRight: 10 }]}>
                    <Formik
                      initialValues={{
                        restaurantName: '',
                        location: '',
                        review: '',
                        rating: 0,
                        tags: [],
                        image: ''
                      }}
                      validationSchema={validationSchema}
                      onSubmit={(values, { resetForm }) => {
                        handleSaveRecommendation(values, { resetForm })
                      }}
                    >
                      {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
                        <>
                          <View style={styles.modalHeader}>
                            <Text style={styles.formTitle}>Recommend Dining Option</Text>
                            <TouchableOpacity
                              style={styles.closeButton}
                              onPress={() => {
                                setPostModalVisible(false)
                                setImage(null)
                                setSelectedDietaryOption(null)
                              }}
                            >
                              <MaterialIcons name="close" size={24} color="black" />
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.cityCountry}>
                            {selectedAirport?.city}, {selectedAirport?.country}
                          </Text>
                          <Text style={styles.label}>Image</Text>
                          <TouchableOpacity onPress={() => openImagePicker(setFieldValue)}>
                            <View style={[styles.imagePicker]}>
                              {image ? (
                                <Image source={{ uri: image }} style={styles.imagePreview} />
                              ) : (
                                <Text style={styles.imagePlaceholder}>Select Image</Text>
                              )}
                            </View>
                          </TouchableOpacity>
                          {touched.image && errors.image && <Text style={styles.errorText}>{errors.image}</Text>}
                          <Text style={styles.label}>Restaurant Name</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="Enter restaurant name"
                            placeholderTextColor="#aaa"
                            onChangeText={handleChange('restaurantName')}
                            onBlur={handleBlur('restaurantName')}
                            value={values.restaurantName}
                          />
                          {touched.restaurantName && errors.restaurantName && (
                            <Text style={styles.errorText}>{errors.restaurantName}</Text>
                          )}
                          <Text style={styles.label}>Location</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="Enter location"
                            placeholderTextColor="#aaa"
                            onChangeText={handleChange('location')}
                            onBlur={handleBlur('location')}
                            value={values.location}
                          />
                          {touched.location && errors.location && (
                            <Text style={styles.errorText}>{errors.location}</Text>
                          )}
                          <Text style={styles.label}>Review</Text>
                          <TextInput
                            style={styles.input}
                            placeholder="Enter review"
                            placeholderTextColor="#aaa"
                            onChangeText={handleChange('review')}
                            onBlur={handleBlur('review')}
                            value={values.review}
                          />
                          {touched.review && errors.review && <Text style={styles.errorText}>{errors.review}</Text>}
                          <View style={{ marginBottom: 10 }}>
                            <Text style={styles.label}>Rating</Text>
                            <InteractableStarRating
                              rating={values.rating}
                              setRating={rating => setFieldValue('rating', rating)}
                              starSize={35}
                              starSpacing={10}
                            />
                          </View>
                          {touched.rating && errors.rating && <Text style={styles.errorText}>{errors.rating}</Text>}
                          <Text style={styles.label}>Dietary Tags (optional)</Text>
                          <View style={styles.dietaryButtonsContainer}>
                            {dietaryOptions.map(tag => (
                              <TouchableOpacity
                                key={tag}
                                style={[
                                  styles.tagButtonModal,
                                  selectedDietaryOption === tag && styles.tagButtonSelected
                                ]}
                                onPress={() => {
                                  setSelectedDietaryOption(selectedDietaryOption === tag ? null : tag)
                                }}
                              >
                                <Text
                                  style={[
                                    styles.tagButtonText,
                                    selectedDietaryOption === tag && styles.tagButtonTextSelected
                                  ]}
                                >
                                  {tag}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                          <View style={styles.buttonContainer}>
                            <TouchableOpacity
                              style={[styles.modalButton, styles.cancelButton]}
                              onPress={() => {
                                setPostModalVisible(false)
                                setImage(null)
                                setSelectedDietaryOption(null)
                              }}
                            >
                              <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.modalButton, styles.saveButton]}
                              onPress={handleSubmit}
                              disabled={loading}
                            >
                              {loading ? (
                                <ActivityIndicator size="small" color="#FFF" />
                              ) : (
                                <Text style={styles.saveButtonText}>Save</Text>
                              )}
                            </TouchableOpacity>
                          </View>
                        </>
                      )}
                    </Formik>
                  </ScrollView>
                </View>
              </BlurView>
            </KeyboardAvoidingView>
          </Modal>

          <Modal
            animationType="fade"
            transparent={true}
            visible={isImageModalVisible}
            onRequestClose={() => setImageModalVisible(false)}
          >
            <TouchableOpacity
              style={styles.imageModalContainer}
              activeOpacity={1}
              onPressOut={() => setImageModalVisible(false)}
            >
              <Image source={{ uri: selectedImage }} style={styles.expandedImage} />
              <TouchableOpacity style={styles.imageModalCloseButton} onPress={() => setImageModalVisible(false)}>
                <MaterialIcons name="close" size={24} color="white" />
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>

          {selectedTab === 'Our Picks' ? (
            places.map(place => (
              <View key={place.place_id} style={styles.card}>
                {/* Place Card Details */}
                <TouchableOpacity onPress={() => openImageModal(place.photoUrl || PLACEHOLDER_IMAGE_URL)}>
                  <Image source={{ uri: place.photoUrl || PLACEHOLDER_IMAGE_URL }} style={styles.image} />
                </TouchableOpacity>
                <View style={styles.cardContent}>
                  <TouchableOpacity
                    style={styles.bookmarkButton}
                    onPress={() =>
                      toggleBookmark(
                        place.place_id,
                        'DINING_API',
                        place.name,
                        place.formatted_address || place.vicinity,
                        place.photoUrl || PLACEHOLDER_IMAGE_URL,
                        place.rating,
                        place.user_ratings_total,
                        place.geometry.location.lat,
                        place.geometry.location.lng
                      )
                    }
                  >
                    <Image
                      source={place.bookmarked ? icons.bookmarkFilled : icons.bookmarkOutline}
                      style={styles.bookmarkIcon}
                    />
                  </TouchableOpacity>
                  <Text style={styles.restaurantName}>{place.name}</Text>
                  <Text style={styles.address}>{place.formatted_address}</Text>
                  <View style={styles.ratingContainer}>
                    <NonInteractableStarRating rating={place.rating} />
                    <Text style={styles.ratingText}>{`${place.rating} (${place.user_ratings_total} reviews)`}</Text>
                  </View>
                  <View style={styles.statusAndMapContainer}>
                    <Text style={[styles.status, place.opening_hours?.open_now ? styles.open : styles.closed]}>
                      {place.opening_hours?.open_now ? 'Open' : 'Closed'}
                    </Text>
                    <TouchableOpacity
                      onPress={() => openInGoogleMaps(place.geometry.location.lat, place.geometry.location.lng)}
                      style={styles.mapsButton}
                    >
                      <FontAwesome name="map-marker" size={20} color="white" />
                      <Text style={styles.mapsButtonText}>Maps</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          ) : crewPicks.length === 0 ? (
            <View style={styles.noCrewPicksContainer}>
              <Image source={NO_CREW_PICKS_IMAGE} style={styles.noCrewPicksImage} />
              <Text style={styles.noCrewPicksText}>No Crew Picks available</Text>
              <TouchableOpacity style={styles.addDiningButton} onPress={() => setPostModalVisible(true)}>
                <Text style={styles.addDiningButtonText}>Add Dining Option</Text>
              </TouchableOpacity>
            </View>
          ) : (
            crewPicks.map(pick => (
              <View key={pick._id} style={styles.card}>
                {/* Crew Pick Card Details */}
                <TouchableOpacity onPress={() => openImageModal(pick.imageUrl || PLACEHOLDER_IMAGE_URL)}>
                  <Image source={{ uri: pick.imageUrl || PLACEHOLDER_IMAGE_URL }} style={styles.image} />
                </TouchableOpacity>
                <View style={styles.cardContent}>
                  <TouchableOpacity
                    style={styles.bookmarkButton}
                    onPress={() =>
                      toggleBookmark(
                        pick._id,
                        'DINING_USER_POST', // Source type is UserPost for crew picks
                        pick.restaurantName,
                        pick.location,
                        pick.imageUrl || PLACEHOLDER_IMAGE_URL,
                        pick.rating,
                        pick.totalReviews || 0
                      )
                    }
                  >
                    <Image
                      source={pick.bookmarked ? icons.bookmarkFilled : icons.bookmarkOutline}
                      style={styles.bookmarkIcon}
                    />
                  </TouchableOpacity>
                  <Text style={styles.restaurantName}>{pick.restaurantName}</Text>
                  <Text style={styles.address}>{pick.location}</Text>
                  <View style={styles.ratingContainer}>
                    <NonInteractableStarRating rating={pick.rating} />
                  </View>
                  <Text style={styles.reviewText}>{pick.review}</Text>
                  {pick.tags && pick.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                      {pick.tags.map(tag => (
                        <TouchableOpacity
                          key={tag}
                          style={[styles.tagButton, pick.tags.includes(tag) && styles.tagButtonSelected]}
                        >
                          <Text style={[styles.tagButtonText, pick.tags.includes(tag) && styles.tagButtonTextSelected]}>
                            {tag}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                  <View style={styles.cardFooter}>
                    <Text style={styles.recommendedBy}>
                      Recommended by {pick.user.firstName} {pick.user.lastName}
                    </Text>
                    <TouchableOpacity style={styles.likeButton} onPress={() => handleLike(pick._id)}>
                      <Image
                        source={pick.userHasLiked ? icons.likeFilled : icons.likeOutline}
                        style={styles.likeIcon}
                      />
                      <Text style={styles.likeCount}>{pick.likes}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}

          {/* Modal for Adding Dining Option */}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  )
}

export default Dining

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
  scrollView: {
    padding: 10
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'white'
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  tabText: {
    padding: 10,
    fontSize: 16,
    color: '#4386AD'
  },
  activeTabText: {
    fontWeight: 'bold',
    textDecorationLine: 'underline'
  },
  iconContainer: {
    flexDirection: 'row'
  },
  icon: {
    padding: 10
  },
  blurView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%'
  },
  postModalView: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '100%',
    marginTop: 100
  },
  formContainer: {
    flexGrow: 1,
    paddingBottom: 20
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%'
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20
  },
  closeButton: {
    padding: 5,
    marginBottom: 20
  },
  label: {
    alignSelf: 'flex-start',
    fontSize: 14,
    fontWeight: 'bold',
    color: 'grey',
    marginBottom: 5
  },
  imagePicker: {
    width: '100%',
    height: 280,
    borderColor: '#4386AD',
    borderWidth: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4
  },
  imagePlaceholder: {
    color: '#aaa'
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 10
  },
  input: {
    height: 40,
    borderColor: '#4386AD',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    width: '100%',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4
  },
  dietaryButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 10
  },
  tagButtonModal: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderColor: '#4386AD',
    borderWidth: 1,
    marginVertical: 8,
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flexBasis: '45%'
  },
  tagButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderColor: '#4386AD',
    borderWidth: 1,
    marginHorizontal: 5,
    marginBottom: 5
  },
  tagButtonSelected: {
    backgroundColor: '#4386AD'
  },
  tagButtonText: {
    color: '#4386AD',
    fontWeight: 'bold',
    fontSize: 16
  },
  tagButtonTextSelected: {
    color: '#FFF'
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginHorizontal: 5,
    width: '45%',
    alignItems: 'center'
  },
  cancelButton: {
    backgroundColor: '#FFF',
    borderColor: 'grey',
    borderWidth: 1
  },
  cancelButtonText: {
    color: 'grey',
    fontWeight: 'bold'
  },
  saveButton: {
    backgroundColor: '#045D91'
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold'
  },
  card: {
    backgroundColor: '#F8FAFC',
    borderColor: '#4386AD',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 20,
    overflow: 'hidden',
    padding: 10
  },
  image: {
    width: '100%',
    height: 250,
    borderRadius: 10
  },
  cardContent: {
    padding: 10,
    position: 'relative'
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingRight: 40
  },
  address: {
    fontSize: 14,
    color: '#555',
    marginVertical: 5,
    paddingRight: 40
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5
  },
  reviewText: {
    fontSize: 14,
    color: '#333',
    marginVertical: 5,
    lineHeight: 20
  },
  statusAndMapContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5
  },
  status: {
    fontSize: 14,
    color: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 5,
    textAlign: 'center',
    minWidth: 100,
    textAlign: 'center',
    marginHorizontal: 5,
    overflow: 'hidden'
  },
  open: {
    backgroundColor: 'green'
  },
  closed: {
    backgroundColor: 'red'
  },
  bookmarkButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 10,
    zIndex: 1
  },
  bookmarkIcon: {
    width: 24,
    height: 24
  },
  mapsButtonContainer: {
    alignSelf: 'flex-start',
    marginTop: 10
  },
  mapsButton: {
    backgroundColor: '#4386AD',
    paddingVertical: 7,
    paddingHorizontal: 15,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    minWidth: 100
  },
  mapsButtonText: {
    color: '#FFF',
    marginLeft: 5
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  expandedImage: {
    width: '90%',
    height: '70%',
    resizeMode: 'contain'
  },
  imageModalCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    padding: 10,
    zIndex: 1
  },
  cityCountry: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 20,
    textAlign: 'center'
  },
  errorText: {
    fontSize: 12,
    color: 'red',
    marginBottom: 10
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 5
  },
  tagButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderColor: '#4386AD',
    borderWidth: 1,
    marginHorizontal: 5,
    marginBottom: 5
  },
  tagButtonSelected: {
    backgroundColor: '#4386AD'
  },
  tagButtonText: {
    color: '#4386AD',
    fontWeight: 'bold'
  },
  tagButtonTextSelected: {
    color: '#FFF'
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end'
  },
  likeIcon: {
    width: 24,
    height: 24,
    marginRight: 5
  },
  likeCount: {
    fontSize: 14,
    color: '#666'
  },
  recommendedBy: {
    fontStyle: 'italic',
    textAlign: 'left'
  },
  noCrewPicksContainer: {
    alignItems: 'center',
    marginTop: 50,
    paddingHorizontal: 20
  },
  noCrewPicksImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    marginBottom: 20
  },
  noCrewPicksText: {
    fontSize: 18,
    color: 'gray',
    textAlign: 'center',
    marginBottom: 20
  },
  addDiningButton: {
    backgroundColor: '#4386AD',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5
  },
  addDiningButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold'
  }
})
