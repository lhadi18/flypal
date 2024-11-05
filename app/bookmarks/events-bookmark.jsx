import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  TextInput,
  Alert // Import Alert from React Native
} from 'react-native'
import React, { useEffect, useState, useCallback } from 'react'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { FontAwesome } from '@expo/vector-icons'
import * as SecureStore from 'expo-secure-store'
import icons from '@/constants/icons'
import axios from 'axios'
import _ from 'lodash'

const EventsBookmark = () => {
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Debounced fetch function to reduce API calls during typing
  const fetchBookmarks = useCallback(
    _.debounce(async (page, query = '') => {
      setLoading(true)
      try {
        const userId = await SecureStore.getItemAsync('userId')
        const source = axios.CancelToken.source()

        const response = await axios.get(
          `https://74ae-2402-1980-24d-8201-85fb-800c-f2c4-1947.ngrok-free.app/api/bookmarks/user/${userId}/events-paginated`,
          {
            params: { page, limit: 10, search: query },
            cancelToken: source.token
          }
        )

        if (response.data.length === 0) {
          setHasMore(false)
        } else {
          setBookmarks(prevBookmarks => (page === 1 ? response.data : [...prevBookmarks, ...response.data]))
        }
      } catch (err) {
        if (axios.isCancel(err)) {
          console.log('Request canceled', err.message)
        } else {
          setError(err)
        }
      } finally {
        setLoading(false)
      }

      return () => source.cancel()
    }, 300),
    []
  )

  // Fetch bookmarks on initial load or when searchQuery changes
  useEffect(() => {
    fetchBookmarks(1, searchQuery)
  }, [searchQuery])

  const loadMoreBookmarks = () => {
    if (hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchBookmarks(nextPage, searchQuery)
    }
  }

  const handleSearchInput = query => {
    setSearchQuery(query)
    setPage(1)
    setHasMore(true)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setPage(0)
    setBookmarks([])
    setHasMore(true)
    fetchBookmarks(1, '') // Fetch initial bookmarks with an empty query
  }

  // Function to confirm before removing a bookmark
  const confirmRemoveBookmark = item => {
    Alert.alert(
      'Remove Bookmark',
      'Are you sure you want to remove this bookmark?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeBookmark(item)
        }
      ],
      { cancelable: true }
    )
  }

  // Function to remove a bookmark
  const removeBookmark = async item => {
    try {
      // API call to remove bookmark (replace with your API endpoint)
      const userId = await SecureStore.getItemAsync('userId')
      await axios.delete(
        `https://74ae-2402-1980-24d-8201-85fb-800c-f2c4-1947.ngrok-free.app/api/bookmarks/user/${userId}/events/${item._id}`
      )
      // Update bookmarks list
      setBookmarks(prevBookmarks => prevBookmarks.filter(bookmark => bookmark._id !== item._id))
    } catch (error) {
      setError(error)
    }
  }

  // Render each bookmark item
  const renderBookmarkItem = ({ item }) => (
    <View style={styles.eventCard}>
      <TouchableOpacity onPress={() => confirmRemoveBookmark(item)} style={styles.bookmarkButton}>
        <Image source={icons.bookmarkFilled} style={styles.bookmarkIcon} />
      </TouchableOpacity>
      <View style={styles.eventHeader}>
        <Image source={{ uri: item.imageUrl }} style={styles.thumbnail} />
        <View style={styles.eventHeaderText}>
          <Text style={styles.eventTitle}>{item.name}</Text>
          {item.airportId && (
            <Text style={styles.airportLocation}>{`${item.airportId.city}, ${item.airportId.country}`}</Text>
          )}
          <Text style={styles.eventTime}>{item.eventTime}</Text>
        </View>
      </View>
      <Text style={styles.eventAddress}>{item.location}</Text>
      <Text style={styles.eventDescription}>{item.eventDescription}</Text>
      <View style={styles.eventActions}>
        <TouchableOpacity onPress={() => Linking.openURL(item.externalAddress)} style={styles.actionButton}>
          <Text style={styles.actionText}>More Info</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openMaps(item.eventLocationMap)} style={styles.mapsButton}>
          <FontAwesome name="map-marker" size={20} color="#FFF" />
          <Text style={styles.mapsButtonText}>Maps</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      {/* Static Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#4386AD" style={styles.icon} />
        <TextInput
          placeholder="Search events by name, city, or country"
          placeholderTextColor="grey"
          style={styles.input}
          value={searchQuery}
          onChangeText={handleSearchInput}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="grey" />
          </TouchableOpacity>
        )}
      </View>

      {/* Scrollable List of Bookmarked Events */}
      <View style={styles.listContainer}>
        <FlatList
          ListHeaderComponent={() => <View style={styles.header}></View>}
          data={bookmarks}
          renderItem={renderBookmarkItem}
          keyExtractor={item => item._id}
          onEndReached={loadMoreBookmarks}
          onEndReachedThreshold={0.5}
          ListFooterComponent={hasMore && <ActivityIndicator size="small" color="#4386AD" />}
        />
      </View>
    </View>
  )
}

export default EventsBookmark

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: 'white'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: 'white',
    borderColor: '#045D91',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  listContainer: {
    flex: 1
  },
  input: {
    height: 40,
    flex: 1,
    fontSize: 16,
    color: 'black'
  },
  icon: {
    marginRight: 10
  },
  clearButton: {
    marginLeft: 10
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
    color: '#333'
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
    position: 'relative'
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
    color: '#333'
  },
  airportLocation: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4386AD',
    marginTop: 5
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
