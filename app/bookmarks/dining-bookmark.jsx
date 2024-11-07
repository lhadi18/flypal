// DiningBookmark.js
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet
} from 'react-native'
import NonInteractableStarRating from '@/components/noninteractable-star-rating'
import React, { useEffect, useState, useCallback } from 'react'
import { useGlobalStore } from '../../store/store'
import * as SecureStore from 'expo-secure-store'
import SearchBar from '@/components/search-bar'
import icons from '../../constants/icons'
import * as Linking from 'expo-linking'
import axios from 'axios'
import _ from 'lodash'

const PLACEHOLDER_IMAGE_URL = '../../assets/images/no-image.png'

const DiningBookmark = () => {
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const selectedAirport = useGlobalStore(state => state.selectedAirport)

  const fetchUserDiningBookmarks = useCallback(
    _.debounce(async (page, query = '') => {
      setLoading(true)
      try {
        const userId = await SecureStore.getItemAsync('userId')
        const response = await axios.get(
          `https://74ae-2402-1980-24d-8201-85fb-800c-f2c4-1947.ngrok-free.app/api/bookmarks/user/${userId}/bookmarks-paginated`,
          { params: { page, limit: 10, search: query } }
        )

        const newBookmarks = response.data

        if (newBookmarks.length === 0) {
          setHasMore(false)
          if (page === 1) setBookmarks([])
        } else {
          setBookmarks(prevBookmarks => (page === 1 ? newBookmarks : [...prevBookmarks, ...newBookmarks]))
          setHasMore(true)
        }
      } catch (error) {
        console.error('Error fetching dining bookmarks:', error)
      } finally {
        setLoading(false)
      }
    }, 300),
    []
  )

  useEffect(() => {
    setBookmarks([])
    setLoading(true)
    setHasMore(true)
    fetchUserDiningBookmarks(1, searchQuery)
  }, [searchQuery])

  const loadMoreBookmarks = () => {
    if (hasMore && !loading) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchUserDiningBookmarks(nextPage, searchQuery)
    }
  }

  const handleSearchInput = query => {
    setSearchQuery(query)
    setPage(1)
    setHasMore(true)
  }

  const clearSearch = () => {
    setSearchQuery('')
    setPage(1)
    setBookmarks([])
    setHasMore(true)
    fetchUserDiningBookmarks(1, '')
  }

  const renderBookmark = ({ item: bookmark }) => (
    <View key={bookmark.diningId || bookmark._id} style={styles.card}>
      <TouchableOpacity onPress={() => openImageModal(bookmark.imageUrl || PLACEHOLDER_IMAGE_URL)}>
        <Image source={{ uri: bookmark.imageUrl || PLACEHOLDER_IMAGE_URL }} style={styles.image} />
      </TouchableOpacity>
      <View style={styles.cardContent}>
        <TouchableOpacity
          style={styles.bookmarkButton}
          onPress={() => handleUnbookmarkPress(bookmark.diningId, bookmark.sourceType, bookmark.airport)}
        >
          <Image source={icons.bookmarkFilled} style={styles.bookmarkIcon} />
        </TouchableOpacity>
        <Text style={styles.restaurantName}>{bookmark.name}</Text>

        <TouchableOpacity onPress={() => handleAddressPress(bookmark.location)}>
          <Text style={styles.address}>{bookmark.location}</Text>
        </TouchableOpacity>

        {bookmark.sourceType === 'DINING_USER_POST' && bookmark.userName && (
          <Text style={styles.recommendedBy}>Recommended by {bookmark.userName}</Text>
        )}

        <View style={styles.ratingContainer}>
          <NonInteractableStarRating rating={bookmark.rating} />
          <Text style={styles.ratingText}>
            {bookmark.sourceType === 'DINING_USER_POST'
              ? `${bookmark.likes} ${bookmark.likes === 1 ? 'like' : 'likes'}`
              : `${bookmark.rating} (${bookmark.totalReviews} reviews)`}
          </Text>
        </View>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <SearchBar
          placeholder="Search by name, city, or country"
          value={searchQuery}
          onChangeText={handleSearchInput}
          onClear={clearSearch}
        />

        {loading && page === 1 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4386AD" />
          </View>
        ) : (
          <FlatList
            contentContainerStyle={styles.flatListContainer}
            data={bookmarks}
            renderItem={renderBookmark}
            keyExtractor={item => item.diningId || item._id}
            onEndReached={loadMoreBookmarks}
            onEndReachedThreshold={0.5}
            ListFooterComponent={hasMore && <ActivityIndicator size="small" color="#4386AD" />}
            ListEmptyComponent={
              !loading && searchQuery ? (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResultsText}>No results for "{searchQuery}"</Text>
                </View>
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  )
}

export default DiningBookmark

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
  flatListContainer: {
    paddingBottom: 20
  },
  innerContainer: {
    flex: 1,
    paddingTop: 15,
    paddingHorizontal: 10
  },
  card: {
    backgroundColor: '#F8FAFC',
    borderColor: '#4386AD',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
    overflow: 'hidden'
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
    color: '#4386AD',
    textDecorationLine: 'underline',
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
  recommendedBy: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#555',
    marginVertical: 5
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
    fontStyle: 'italic'
  }
})
