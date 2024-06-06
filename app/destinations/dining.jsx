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
  Alert
} from 'react-native'
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete'
import NonInteractableStarRating from '@/components/noninteractable-star-rating'
import InteractableStarRating from '@/components/interactable-star-rating'
import { MaterialIcons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import React, { useState } from 'react'
import { BlurView } from 'expo-blur'

const bookmarkIconUrl = 'https://via.placeholder.com/24/4386AD/FFFFFF?text=B'

const diningOptions = [
  {
    id: 1,
    name: 'Restaurant A',
    address: '123 Main St',
    rating: 4.5,
    totalRatings: 120,
    status: 'Open',
    imageUrl: 'https://via.placeholder.com/150',
    dietary: 'Halal'
  },
  {
    id: 2,
    name: 'Restaurant B',
    address: '456 Elm St',
    rating: 4.0,
    totalRatings: 90,
    status: 'Closed',
    imageUrl: 'https://via.placeholder.com/150',
    dietary: 'Vegetarian'
  }
]

const Dining = () => {
  const [selectedDietary, setSelectedDietary] = useState('')
  const [filteredOptions, setFilteredOptions] = useState(diningOptions)
  const [isFilterModalVisible, setFilterModalVisible] = useState(false)
  const [isPostModalVisible, setPostModalVisible] = useState(false)
  const [location, setLocation] = useState(null)

  const [image, setImage] = useState(null)
  const [restaurantName, setRestaurantName] = useState('')
  const [review, setReview] = useState('')
  const [rating, setRating] = useState(0)
  const [tags, setTags] = useState([])

  const applyFilters = () => {
    let filtered = diningOptions.filter(option => selectedDietary === '' || option.dietary === selectedDietary)
    setFilteredOptions(filtered)
    setFilterModalVisible(false)
  }

  const openImagePicker = async () => {
    const options = [
      { text: 'Take a Photo', onPress: openCamera },
      { text: 'Choose from Library', onPress: openLibrary },
      { text: 'Cancel', style: 'cancel' }
    ]
    Alert.alert('Select Image Source', '', options)
  }

  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync()

    if (permissionResult.granted === false) {
      alert('Camera access is required to take a photo.')
      return
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1
    })

    if (!result.canceled) {
      setImage(result.assets[0].uri)
    }
  }

  const openLibrary = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1
    })

    if (!result.canceled) {
      setImage(result.assets[0].uri)
    }
  }

  const saveRecommendation = () => {
    // Save the recommendation logic here
    setPostModalVisible(false)
  }

  const resetForm = () => {
    setImage(null)
    setRestaurantName('')
    setLocation(null)
    setReview('')
    setRating(0)
    setTags([])
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.icon} onPress={() => setFilterModalVisible(true)}>
          <MaterialIcons name="filter-list" size={24} color="#4386AD" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.icon} onPress={() => setPostModalVisible(true)}>
          <MaterialIcons name="post-add" size={24} color="#4386AD" />
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isFilterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <BlurView intensity={50} style={styles.blurView}>
          <View style={styles.modalView}>
            <View style={styles.dietaryButtonsContainer}>
              {['Halal', 'Vegetarian', 'Vegan'].map(diet => (
                <TouchableOpacity
                  key={diet}
                  style={[styles.dietaryButton, selectedDietary === diet && styles.dietaryButtonSelected]}
                  onPress={() => setSelectedDietary(diet)}
                >
                  <Text
                    style={[styles.dietaryButtonText, selectedDietary === diet && styles.dietaryButtonTextSelected]}
                  >
                    {diet}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button title="Search" onPress={applyFilters} />
          </View>
        </BlurView>
      </Modal>

      {/* Post Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isPostModalVisible}
        onRequestClose={() => {
          resetForm()
          setPostModalVisible(false)
        }}
      >
        <BlurView intensity={50} style={styles.blurView}>
          <View style={styles.postModalView}>
            <ScrollView contentContainerStyle={styles.formContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.formTitle}>Recommend Dining Option</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    resetForm()
                    setPostModalVisible(false)
                  }}
                >
                  <MaterialIcons name="close" size={24} color="black" />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Image</Text>
              <TouchableOpacity onPress={openImagePicker}>
                <View style={[styles.imagePicker]}>
                  {image ? (
                    <Image source={{ uri: image }} style={styles.imagePreview} />
                  ) : (
                    <Text style={styles.imagePlaceholder}>Select Image</Text>
                  )}
                </View>
              </TouchableOpacity>

              <Text style={styles.label}>Restaurant Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter restaurant name"
                placeholderTextColor="#aaa"
                value={restaurantName}
                onChangeText={setRestaurantName}
              />

              <Text style={styles.label}>Location</Text>
              <GooglePlacesAutocomplete
                placeholder="Enter location"
                minLength={2}
                fetchDetails={true}
                onPress={(data, details = null) => {
                  // 'details' is provided when fetchDetails = true
                  setLocation(details?.formatted_address)
                }}
                query={{
                  key: '',
                  language: 'en'
                }}
                styles={{
                  textInputContainer: styles.googlePlacesInputContainer,
                  textInput: styles.googlePlacesInput
                }}
              />

              <Text style={styles.label}>Review</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter review"
                placeholderTextColor="#aaa"
                value={review}
                onChangeText={setReview}
              />

              <Text style={styles.label}>Rating</Text>
              <InteractableStarRating rating={rating} setRating={setRating} starSize={30} starSpacing={10} />

              <Text style={styles.label}>Tags (optional)</Text>
              <View style={styles.dietaryButtonsContainer}>
                {['Halal', 'Vegetarian', 'Vegan'].map(tag => (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tagButton, tags.includes(tag) && styles.tagButtonSelected]}
                    onPress={() => setTags([tag])}
                  >
                    <Text style={[styles.tagButtonText, tags.includes(tag) && styles.tagButtonTextSelected]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    resetForm()
                    setPostModalVisible(false)
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={saveRecommendation}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </BlurView>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollView}>
        {filteredOptions.map(option => (
          <View key={option.id} style={styles.card}>
            <Image source={{ uri: option.imageUrl }} style={styles.image} />
            <View style={styles.cardContent}>
              <TouchableOpacity style={styles.bookmarkButton}>
                <Image source={{ uri: bookmarkIconUrl }} style={styles.bookmarkIcon} />
              </TouchableOpacity>
              <Text style={styles.restaurantName}>{option.name}</Text>
              <Text style={styles.address}>{option.address}</Text>
              <View style={styles.ratingContainer}>
                <NonInteractableStarRating rating={option.rating} />
                <Text style={styles.ratingText}>{`${option.rating} (${option.totalRatings})`}</Text>
              </View>
              <Text style={[styles.status, option.status === 'Open' ? styles.open : styles.closed]}>
                {option.status}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

export default Dining

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  scrollView: {
    padding: 10
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 10
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
    width: '90%' // Updated width
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
    width: '100%', // Full width
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
    width: '100%', // Updated width
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
  googlePlacesInputContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#4386AD',
    borderRadius: 5,
    marginBottom: 10
  },
  googlePlacesInput: {
    height: 40,
    paddingHorizontal: 10
  },
  dietaryButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    width: '100%'
  },
  tagButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderColor: '#4386AD',
    borderWidth: 1,
    marginHorizontal: 5
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
  },
  card: {
    backgroundColor: '#F8FAFC',
    borderColor: '#4386AD',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 20,
    overflow: 'hidden'
  },
  image: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10
  },
  cardContent: {
    padding: 10,
    position: 'relative'
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  address: {
    fontSize: 14,
    color: '#555',
    marginVertical: 5
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
  status: {
    fontSize: 14,
    color: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginVertical: 5,
    textAlign: 'center',
    width: 80
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
  }
})
