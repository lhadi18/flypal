import {
  StyleSheet,
  View,
  Text,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TouchableOpacity,
  Image,
  Animated,
  TextInput,
  TouchableWithoutFeedback
} from 'react-native'
import { fetchUserRecommendations, deleteRecommendation, updateRecommendation } from '../../services/destination-api'
import InteractableStarRating from '@/components/interactable-star-rating'
import RecommendationCard from '@/components/recommendation-card'
import React, { useState, useEffect, useRef } from 'react'
import { MaterialIcons } from '@expo/vector-icons'
import * as SecureStore from 'expo-secure-store'
import * as ImagePicker from 'expo-image-picker'
import { BlurView } from 'expo-blur'
import { Formik } from 'formik'
import * as Yup from 'yup'

const NO_RECOMMENDATIONS_IMAGE = require('../../assets/images/empty-question.jpg')

const MyRecommendations = () => {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(true)
  const [isImageModalVisible, setImageModalVisible] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [isEditModalVisible, setEditModalVisible] = useState(false)
  const [currentRecommendation, setCurrentRecommendation] = useState(null)
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const getUserRecommendations = async () => {
      try {
        const userId = await SecureStore.getItemAsync('userId')
        if (userId) {
          const data = await fetchUserRecommendations(userId)
          setRecommendations(data)
        }
      } catch (error) {
        console.error('Failed to fetch user recommendations:', error)
      } finally {
        setLoading(false)
      }
    }

    getUserRecommendations()
  }, [])

  const handleDelete = id => {
    Alert.alert('Delete Recommendation', 'Are you sure you want to delete this recommendation?', [
      {
        text: 'Cancel',
        style: 'cancel'
      },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await deleteRecommendation(id)
            setRecommendations(recommendations.filter(rec => rec._id !== id))
            setSuccessMessage('Recommendation deleted successfully')
            fadeIn()
            setTimeout(() => {
              fadeOut()
            }, 3000)
          } catch (error) {
            console.error('Failed to delete recommendation:', error)
          }
        }
      }
    ])
  }

  const handleEdit = recommendation => {
    setCurrentRecommendation(recommendation)
    setEditModalVisible(true)
  }

  const openImageModal = imageUri => {
    setSelectedImage(imageUri)
    setImageModalVisible(true)
  }

  const closeImageModal = () => {
    setSelectedImage(null)
    setImageModalVisible(false)
  }

  const fadeIn = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true
    }).start()
  }

  const fadeOut = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true
    }).start(() => setSuccessMessage(''))
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
      setFieldValue('image', result.assets[0].uri)
    }
  }

  const validationSchema = Yup.object().shape({
    restaurantName: Yup.string().required('Restaurant Name is required'),
    location: Yup.string().required('Location is required'),
    review: Yup.string().required('Review is required'),
    rating: Yup.number().min(1, 'Rating is required').max(5, 'Rating must be at most 5').required('Rating is required'),
    image: Yup.string().required('Image is required')
  })

  const handleUpdateRecommendation = async (values, { resetForm }) => {
    setLoading(true)
    const data = {
      ...values,
      userId: currentRecommendation.user._id,
      _id: currentRecommendation._id
    }

    try {
      const updatedRecommendation = await updateRecommendation(data)
      setRecommendations(
        recommendations.map(rec => (rec._id === updatedRecommendation._id ? updatedRecommendation : rec))
      )
      console.log('Dining recommendation updated successfully')
      setEditModalVisible(false)
      resetForm()
      setSuccessMessage('Recommendation updated successfully')
      fadeIn()
      setTimeout(() => {
        fadeOut()
      }, 3000)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        {successMessage ? (
          <Animated.View style={[styles.successMessageContainer, { opacity: fadeAnim }]}>
            <Text style={styles.successMessage}>{successMessage}</Text>
          </Animated.View>
        ) : null}
        {recommendations.length > 0 ? (
          recommendations.map(rec => (
            <RecommendationCard
              key={rec._id}
              recommendation={rec}
              openImageModal={openImageModal}
              handleLike={() => {}}
              handleDelete={handleDelete}
              handleEdit={handleEdit}
              openInGoogleMaps={() => {}}
            />
          ))
        ) : (
          <View style={styles.noRecommendationsContainer}>
            <Image source={NO_RECOMMENDATIONS_IMAGE} style={styles.noRecommendationsImage} />
            <Text style={styles.noRecommendationsText}>You have not made any recommendations</Text>
          </View>
        )}
      </ScrollView>

      <Modal animationType="fade" transparent={true} visible={isImageModalVisible} onRequestClose={closeImageModal}>
        <TouchableOpacity style={styles.imageModalContainer} activeOpacity={1} onPressOut={closeImageModal}>
          <Image source={{ uri: selectedImage }} style={styles.expandedImage} />
          <TouchableOpacity style={styles.imageModalCloseButton} onPress={closeImageModal}>
            <MaterialIcons name="close" size={24} color="white" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Edit Modal */}
      {currentRecommendation && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={isEditModalVisible}
          onRequestClose={() => {
            setEditModalVisible(false)
            setCurrentRecommendation(null)
          }}
        >
          <BlurView intensity={50} style={styles.blurView}>
            <View style={styles.editModalView}>
              <Formik
                initialValues={{
                  restaurantName: currentRecommendation.restaurantName,
                  location: currentRecommendation.location,
                  review: currentRecommendation.review,
                  rating: currentRecommendation.rating,
                  tags: currentRecommendation.tags,
                  image: currentRecommendation.imageUrl
                }}
                validationSchema={validationSchema}
                onSubmit={(values, { resetForm }) => {
                  handleUpdateRecommendation(values, { resetForm })
                }}
              >
                {({ handleChange, handleBlur, handleSubmit, values, errors, touched, setFieldValue }) => (
                  <ScrollView contentContainerStyle={[styles.formContainer, { paddingRight: 10 }]}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.formTitle}>Edit Dining Recommendation</Text>
                      <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => {
                          setEditModalVisible(false)
                          setCurrentRecommendation(null)
                        }}
                      >
                        <MaterialIcons name="close" size={24} color="black" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.label}>Image</Text>
                    <TouchableOpacity onPress={() => openImagePicker(setFieldValue)}>
                      <View style={[styles.imagePicker]}>
                        {values.image ? (
                          <Image source={{ uri: values.image }} style={styles.imagePreview} />
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
                    {touched.location && errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
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
                    <Text style={styles.label}>Tags (optional)</Text>
                    <View style={styles.dietaryButtonsContainer}>
                      {['Halal', 'Vegetarian', 'Vegan'].map(tag => (
                        <TouchableOpacity
                          key={tag}
                          style={[styles.tagButtonModal, values.tags.includes(tag) && styles.tagButtonSelected]}
                          onPress={() => {
                            if (values.tags.includes(tag)) {
                              setFieldValue(
                                'tags',
                                values.tags.filter(t => t !== tag)
                              )
                            } else {
                              setFieldValue('tags', [...values.tags, tag])
                            }
                          }}
                        >
                          <Text
                            style={[styles.tagButtonText, values.tags.includes(tag) && styles.tagButtonTextSelected]}
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
                          setEditModalVisible(false)
                          setCurrentRecommendation(null)
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
                  </ScrollView>
                )}
              </Formik>
            </View>
          </BlurView>
        </Modal>
      )}
    </SafeAreaView>
  )
}

export default MyRecommendations

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  scrollView: {
    padding: 10
  },
  successMessageContainer: {
    backgroundColor: '#d4edda',
    padding: 10,
    borderRadius: 5,
    marginVertical: 10
  },
  successMessage: {
    color: '#155724',
    fontWeight: 'bold'
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
  noRecommendationsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50
  },
  noRecommendationsImage: {
    width: 150,
    height: 150,
    marginBottom: 20
  },
  noRecommendationsText: {
    color: 'grey',
    fontSize: 16,
    textAlign: 'center'
  },
  blurView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  editModalView: {
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
    justifyContent: 'space-around',
    marginVertical: 10,
    width: '100%'
  },
  tagButtonModal: {
    paddingVertical: 7,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderColor: '#4386AD',
    borderWidth: 1,
    marginHorizontal: 5
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
    backgroundColor: '#4386AD'
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold'
  }
})
