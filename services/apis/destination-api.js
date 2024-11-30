import * as SecureStore from 'expo-secure-store'
import axios from 'axios'

const API_URL = 'https://508d-2001-e68-5472-cb83-28c2-56ed-e437-8c8c.ngrok-free.app'

export const fetchNearbyPlaces = async (latitude, longitude, city, dietaryOption = '') => {
  try {
    const response = await axios.get(`${API_URL}/api/places/fetchNearbyPlaces`, {
      params: {
        latitude,
        longitude,
        city,
        dietaryOption,
        radius: 7500,
        type: 'restaurant'
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
      type: 'image/jpeg',
      name: 'photo.jpg'
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

export const fetchCrewPicks = async (airportId, dietaryOption) => {
  const url = dietaryOption
    ? `${API_URL}/api/dining/crew-picks/${airportId}?dietaryOption=${dietaryOption}`
    : `${API_URL}/api/dining/crew-picks/${airportId}`

  const response = await axios.get(url)
  return response.data
}

export const likeRecommendation = async (id, userId) => {
  const response = await axios.post(`${API_URL}/api/dining/crew-picks/${id}/like`, { userId })
  return response.data
}

export const fetchUserRecommendations = async userId => {
  const response = await axios.get(`${API_URL}/api/dining/user-recommendations/${userId}`)
  return response.data
}

export const deleteRecommendation = async id => {
  await axios.delete(`${API_URL}/api/dining/recommendation/${id}`)
}

export const updateRecommendation = async data => {
  const formData = new FormData()
  formData.append('restaurantName', data.restaurantName)
  formData.append('location', data.location)
  formData.append('review', data.review)
  formData.append('rating', data.rating)
  formData.append('tags', JSON.stringify(data.tags))

  if (data.image) {
    formData.append('image', {
      uri: data.image,
      type: 'image/jpeg',
      name: 'photo.jpg'
    })
  }

  try {
    const response = await axios.put(`${API_URL}/api/dining/recommendation/${data._id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    if (response.status === 200) {
      console.log('Dining recommendation updated successfully')
      return response.data
    } else {
      console.error('Failed to update dining recommendation')
      throw new Error('Failed to update dining recommendation')
    }
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}
