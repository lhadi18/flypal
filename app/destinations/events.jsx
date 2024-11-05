import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Linking, ActivityIndicator } from 'react-native'
import { useGlobalStore } from '../../store/store'
import React, { useState, useEffect } from 'react'
import { FontAwesome } from '@expo/vector-icons'
import * as SecureStore from 'expo-secure-store'
import icons from '@/constants/icons'
import { v5 as uuidv5 } from 'uuid'
import axios from 'axios'

const NAMESPACE_UUID = '8dacbeb2-5058-4442-bd68-89bd7fd3e33a'

const Events = () => {
  const selectedAirport = useGlobalStore(state => state.selectedAirport)
  const [events, setEvents] = useState([])
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Function to generate a unique event ID based on title and date
  const generateEventId = (title, dateWhen) => {
    return uuidv5(`${title}-${dateWhen}`, NAMESPACE_UUID)
  }

  // Fetch bookmarks and events on component mount
  useEffect(() => {
    const fetchBookmarksAndEvents = async () => {
      try {
        const userId = await SecureStore.getItemAsync('userId')

        // Fetch Bookmarks
        const bookmarksResponse = await axios.get(
          `https://74ae-2402-1980-24d-8201-85fb-800c-f2c4-1947.ngrok-free.app/api/bookmarks/user/${userId}`
        )
        const userBookmarks = bookmarksResponse.data
        const bookmarkedEventKeys = userBookmarks
          .filter(b => b.sourceType === 'EVENT_API')
          .map(b => generateEventId(b.name, b.eventTime)) // generate IDs for comparison

        // Fetch Events
        const eventsResponse = await axios.get(
          'https://74ae-2402-1980-24d-8201-85fb-800c-f2c4-1947.ngrok-free.app/api/events/getEvents',
          {
            params: {
              city: selectedAirport.city,
              country: selectedAirport.country
            }
          }
        )
        const fetchedEvents = eventsResponse.data.events.map(event => ({
          ...event,
          uniqueId: generateEventId(event.title, event.date.when),
          bookmarked: bookmarkedEventKeys.includes(generateEventId(event.title, event.date.when))
        }))

        // Update state
        setBookmarks(bookmarkedEventKeys)
        setEvents(fetchedEvents)
        setLoading(false)
      } catch (err) {
        setError(err)
        setLoading(false)
      }
    }

    fetchBookmarksAndEvents()
  }, [selectedAirport])

  const toggleBookmark = async (id, eventDetails) => {
    try {
      const userId = await SecureStore.getItemAsync('userId')
      const bookmarkKey = generateEventId(eventDetails.title, eventDetails.date.when)
      const isBookmarked = bookmarks.includes(bookmarkKey)
      const endpoint = isBookmarked ? 'unbookmark' : 'bookmark'

      await axios.post(`https://74ae-2402-1980-24d-8201-85fb-800c-f2c4-1947.ngrok-free.app/api/bookmarks/${endpoint}`, {
        userId,
        eventId: id,
        airportId: selectedAirport.id,
        sourceType: 'EVENT_API',
        name: eventDetails.title,
        location: eventDetails.address.join(', '),
        imageUrl: eventDetails.thumbnail,
        externalAddress: eventDetails.link,
        eventLocationMap: eventDetails.event_location_map.link,
        eventTime: eventDetails.date.when,
        eventDescription: eventDetails.description
      })

      // Update the bookmark state locally
      setEvents(prevEvents =>
        prevEvents.map(event => (event.uniqueId === bookmarkKey ? { ...event, bookmarked: !isBookmarked } : event))
      )
      setBookmarks(prevBookmarks =>
        isBookmarked ? prevBookmarks.filter(key => key !== bookmarkKey) : [...prevBookmarks, bookmarkKey]
      )
    } catch (error) {
      console.error('Failed to update bookmark:', error)
    }
  }

  const openMaps = link => {
    Linking.openURL(link)
  }

  const renderEventItem = ({ item }) => (
    <View style={styles.eventCard}>
      <TouchableOpacity onPress={() => toggleBookmark(item.uniqueId, item)} style={styles.bookmarkButton}>
        <Image source={item.bookmarked ? icons.bookmarkFilled : icons.bookmarkOutline} style={styles.bookmarkIcon} />
      </TouchableOpacity>
      <View style={styles.eventHeader}>
        <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
        <View style={styles.eventHeaderText}>
          <Text style={styles.eventTitle}>{item.title}</Text>
          <Text style={styles.eventTime}>{item.date.when}</Text>
        </View>
      </View>
      <Text style={styles.eventAddress}>{item.address.join(', ')}</Text>
      <Text style={styles.eventDescription}>{item.description}</Text>
      <View style={styles.eventActions}>
        <TouchableOpacity onPress={() => Linking.openURL(item.link)} style={styles.actionButton}>
          <Text style={styles.actionText}>More Info</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openMaps(item.event_location_map.link)} style={styles.mapsButton}>
          <FontAwesome name="map-marker" size={20} color="#FFF" />
          <Text style={styles.mapsButtonText}>Maps</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4386AD" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load events. Please try again later.</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        ListHeaderComponent={() => (
          <View style={styles.header}>
            <Text style={styles.title}>Discover Local Events</Text>
            <Text style={styles.subtitle}>
              {selectedAirport.city}, {selectedAirport.country}
            </Text>
          </View>
        )}
        data={events}
        renderItem={renderEventItem}
        keyExtractor={item => item.uniqueId}
      />
    </View>
  )
}

export default Events

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: 'white'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5, // Adjusted spacing
    textAlign: 'center',
    color: '#333'
  },
  subtitle: {
    fontSize: 20,
    marginBottom: 15,
    textAlign: 'center',
    color: '#666'
  },
  eventCard: {
    backgroundColor: '#FFF',
    borderColor: '#4386AD',
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    position: 'relative' // Needed for positioning the bookmark button
  },
  eventHeader: {
    flexDirection: 'row',
    marginBottom: 10,
    marginRight: 20
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15
  },
  eventHeaderText: {
    flex: 1,
    justifyContent: 'center'
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingRight: 10
  },
  eventTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 5
  },
  eventAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10
  },
  eventDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15
  },
  eventActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  actionButton: {
    backgroundColor: '#4386AD',
    padding: 10,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center'
  },
  actionText: {
    color: '#FFF',
    marginRight: 5
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginTop: 20
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: 'contain'
  },
  mapsButton: {
    backgroundColor: '#4386AD',
    padding: 10,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center'
  },
  mapsButtonText: {
    color: '#FFF',
    marginLeft: 5,
    fontWeight: 'bold'
  },
  bookmarkButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1
  },
  bookmarkIcon: {
    width: 24,
    height: 24
  }
})
