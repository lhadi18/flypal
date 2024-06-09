const axios = require('axios')
const GOOGLE_PLACES_API_KEY = 'AIzaSyA8LzzpQq2iggNyOicLuux_16ORiybMVgs' // Replace with your actual key
const PLACEHOLDER_IMAGE_URL = '../../assets/images/no-image.png'

interface Place {
  photos?: { photo_reference: string }[]
  types: string[]
  user_ratings_total: number
  photoUrl?: string
}

export const getNearbyPlaces = async (latitude: string, longitude: string, radius: string, type: string) => {
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&key=${GOOGLE_PLACES_API_KEY}`
  const response = await axios.get(url)

  // Filter out unwanted types and places with fewer than 100 reviews
  const filteredPlaces: Place[] = response.data.results.filter((place: Place) => {
    const unwantedTypes = ['lodging', 'gym', 'health', 'spa']
    return !place.types.some(type => unwantedTypes.includes(type)) && place.user_ratings_total >= 100
  })

  // Fetch photos for the filtered places
  const placesWithPhotos = await Promise.all(
    filteredPlaces.map(async (place: Place) => {
      if (place.photos && place.photos.length > 0) {
        const photoUrl = getPhotoUrl(place.photos[0].photo_reference)
        place.photoUrl = photoUrl
      } else {
        place.photoUrl = PLACEHOLDER_IMAGE_URL
      }
      return place
    })
  )

  return placesWithPhotos
}

const getPhotoUrl = (photoReference: string) => {
  const maxWidth = 400
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${GOOGLE_PLACES_API_KEY}`
}
