import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Linking, ActivityIndicator } from 'react-native'
import { useGlobalStore } from '../../store/store'
import React, { useState, useEffect } from 'react'
import { FontAwesome } from '@expo/vector-icons'
import icons from '@/constants/icons'
import axios from 'axios'

const Events = () => {
  const selectedAirport = useGlobalStore(state => state.selectedAirport)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get(
          'https://8799-103-18-0-20.ngrok-free.app/api/events/getEvents',
          {
            params: {
              city: selectedAirport.city,
              country: selectedAirport.country
            }
          }
        )
        setEvents(response.data.events)
        setLoading(false)
      } catch (err) {
        setError(err)
        setLoading(false)
      }
    }

    fetchEvents()
  }, [selectedAirport])

  const toggleBookmark = id => {
    setEvents(events.map(event => (event.title === id ? { ...event, bookmarked: !event.bookmarked } : event)))
  }

  const openMaps = link => {
    Linking.openURL(link)
  }

  const renderEventItem = ({ item }) => (
    <View style={styles.eventCard}>
      <TouchableOpacity onPress={() => toggleBookmark(item.title)} style={styles.bookmarkButton}>
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
        keyExtractor={item => `${item.title}-${item.date.when}`} // Ensuring unique keys
      />
    </View>
  )
}

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
    marginBottom: 10
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

export default Events
