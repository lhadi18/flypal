import * as SecureStore from 'expo-secure-store'
import axios from 'axios'

const API_URL = 'https://cfff-2402-1980-8288-81b8-9dfc-3344-2fa3-9857.ngrok-free.app'

export const fetchNearbyPlaces = async (latitude, longitude) => {
  try {
    const response = await axios.get(`${API_URL}/api/places/fetchNearbyPlaces`, {
      params: {
        latitude,
        longitude,
        radius: 7500, // 5 km radius
        type: 'cafe'
      }
    })
    return response.data
  } catch (error) {
    console.error('Failed to fetch nearby places:', error)
    throw error
  }
}

export const saveRecommendation = async data => {
  const formData = new FormData()
  formData.append('restaurantName', data.restaurantName)
  formData.append('location', data.location)
  formData.append('review', data.review)
  formData.append('rating', data.rating)
  formData.append('tags', JSON.stringify(data.tags))
  formData.append('airportId', data.airportId)

  if (data.image) {
    formData.append('image', {
      uri: data.image,
      type: 'image/jpeg', // or the appropriate image type
      name: 'photo.jpg' // or the appropriate image name
    })
  }

  try {
    const userId = await SecureStore.getItemAsync('userId')
    if (userId) {
      formData.append('userId', userId)
    } else {
      console.error('User ID not found')
      throw new Error('User ID not found')
    }

    const response = await axios.post(`${API_URL}/api/dining/recommendations`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    if (response.status === 201) {
      console.log('Dining recommendation added successfully')
      return response.data
    } else {
      console.error('Failed to add dining recommendation')
      throw new Error('Failed to add dining recommendation')
    }
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}

export const fetchCrewPicks = async airportId => {
  const response = await axios.get(`${API_URL}/api/dining/crew-picks/${airportId}`)
  return response.data
}

export const likeRecommendation = async (id, userId) => {
  const response = await axios.post(`${API_URL}/api/dining/crew-picks/${id}/like`, { userId })
  return response.data
}
