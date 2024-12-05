import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert
} from 'react-native'
import React, { useEffect, useState, useCallback } from 'react'
import { FontAwesome } from '@expo/vector-icons'
import * as SecureStore from 'expo-secure-store'
import SearchBar from '@/components/search-bar'
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

  useEffect(() => {
    setBookmarks([])
    setLoading(true)
    setHasMore(true)
    fetchBookmarks(1, searchQuery)
  }, [searchQuery])

  const renderLoadingIndicator = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#4386AD" />
    </View>
  )

  const fetchBookmarks = useCallback(
    _.debounce(async (page, query = '') => {
      setLoading(true)
      try {
        const userId = await SecureStore.getItemAsync('userId')
        const source = axios.CancelToken.source()

        const response = await axios.get(
          `https://028d-103-18-0-19.ngrok-free.app/api/bookmarks/user/${userId}/events-paginated`,
          {
            params: { page, limit: 10, search: query },
            cancelToken: source.token
          }
        )

        console.log(response.data)

        if (response.data.length === 0) {
          setHasMore(false)
          if (page === 1) setBookmarks([])
        } else {
          setBookmarks(prevBookmarks => (page === 1 ? response.data : [...prevBookmarks, ...response.data]))
        }
      } catch (err) {
        if (!axios.isCancel(err)) {
          setError(err)
        }
      } finally {
        setLoading(false)
      }

      return () => source.cancel()
    }, 300),
    []
  )

  const confirmRemoveBookmark = item => {
    Alert.alert(
      'Remove Bookmark',
      `Are you sure you want to remove this bookmark?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Remove',
          onPress: async () => {
            try {
              const userId = await SecureStore.getItemAsync('userId')
              await axios.post('https://028d-103-18-0-19.ngrok-free.app/api/bookmarks/unbookmark', {
                userId,
                sourceType: 'EVENT_API',
                eventId: item.eventId,
                airportId: item.airportId._id
              })

              setBookmarks(prevBookmarks => prevBookmarks.filter(bookmark => bookmark._id !== item._id))
            } catch (error) {
              console.error('Failed to unbookmark:', error)
              Alert.alert('Error', 'Failed to remove the bookmark. Please try again.')
            }
          }
        }
      ],
      { cancelable: true }
    )
  }

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
    fetchBookmarks(1, '')
  }

  const openMaps = eventLocationMap => {
    if (eventLocationMap) {
      Linking.openURL(eventLocationMap)
    }
  }

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
      <SearchBar
        placeholder="Search events by name, city, or country"
        value={searchQuery}
        onChangeText={handleSearchInput}
        onClear={clearSearch}
      />

      <View style={styles.listContainer}>
        {loading && page === 1 ? (
          renderLoadingIndicator()
        ) : (
          <FlatList
            data={bookmarks}
            renderItem={renderBookmarkItem}
            keyExtractor={item => item._id}
            onEndReached={loadMoreBookmarks}
            onEndReachedThreshold={0.5}
            ListFooterComponent={hasMore && renderLoadingIndicator()}
            ListEmptyComponent={() =>
              !loading && (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>No results for "{searchQuery}"</Text>
                </View>
              )
            }
          />
        )}
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

  listContainer: {
    flex: 1
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
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  actionText: {
    color: '#FFF',
    fontWeight: 'bold',
    textAlign: 'center'
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
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  noResultsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center'
  }
})
