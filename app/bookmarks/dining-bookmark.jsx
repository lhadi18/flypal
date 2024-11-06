import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  Image,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  TextInput
} from 'react-native'
import NonInteractableStarRating from '@/components/noninteractable-star-rating'
import React, { useEffect, useState, useCallback } from 'react'
import Ionicons from 'react-native-vector-icons/Ionicons'
import { useGlobalStore } from '../../store/store'
import * as SecureStore from 'expo-secure-store'
import icons from '../../constants/icons'
import * as Linking from 'expo-linking'
import axios from 'axios'
import _ from 'lodash'

const PLACEHOLDER_IMAGE_URL = '../../assets/images/no-image.png'

const DiningBookmark = () => {
  const [bookmarks, setBookmarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [isImageModalVisible, setImageModalVisible] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const selectedAirport = useGlobalStore(state => state.selectedAirport)

  // Fetching bookmarks with search and pagination
  const fetchUserDiningBookmarks = useCallback(
    _.debounce(async (page, query = '') => {
      try {
        setLoading(true)
        const userId = await SecureStore.getItemAsync('userId')
        const response = await axios.get(
          `https://74ae-2402-1980-24d-8201-85fb-800c-f2c4-1947.ngrok-free.app/api/bookmarks/user/${userId}/bookmarks-paginated`,
          { params: { page, limit: 10, search: query } }
        )
        const newBookmarks = response.data

        if (newBookmarks.length === 0) {
          setHasMore(false)
        } else {
          setBookmarks(prevBookmarks => (page === 1 ? newBookmarks : [...prevBookmarks, ...newBookmarks]))
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
    fetchUserDiningBookmarks(1, '')
  }

  const unbookmark = async (diningId, sourceType, airportId) => {
    try {
      const userId = await SecureStore.getItemAsync('userId')
      const isBookmarked = bookmarks.some(bookmark => bookmark.diningId === diningId)

      const endpoint = isBookmarked ? 'unbookmark' : 'bookmark'
      const requestBody = { diningId, userId, sourceType, airportId }

      await axios.post(
        `https://74ae-2402-1980-24d-8201-85fb-800c-f2c4-1947.ngrok-free.app/api/bookmarks/${endpoint}`,
        requestBody,
        { headers: { 'Content-Type': 'application/json' } }
      )

      setBookmarks(prevBookmarks =>
        isBookmarked
          ? prevBookmarks.filter(bookmark => bookmark.diningId !== diningId)
          : [...prevBookmarks, { diningId, bookmarked: true }]
      )
    } catch (error) {
      console.error('Failed to update bookmark:', error)
    }
  }

  const handleUnbookmarkPress = (diningId, sourceType, airportId) => {
    Alert.alert(
      'Remove Bookmark',
      'Are you sure you want to remove this bookmark?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', onPress: () => unbookmark(diningId, sourceType, airportId), style: 'destructive' }
      ],
      { cancelable: true }
    )
  }

  const handleAddressPress = location => {
    Alert.alert(
      'Open Maps',
      'Do you want to open this location in your maps app?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open',
          onPress: () => {
            const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
            Linking.openURL(url)
          }
        }
      ],
      { cancelable: true }
    )
  }

  const openImageModal = imageUri => {
    setSelectedImage(imageUri)
    setImageModalVisible(true)
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
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#4386AD" style={styles.icon} />
        <TextInput
          placeholder="Search by name, city, or country"
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

      {loading && page === 1 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4386AD" />
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          renderItem={renderBookmark}
          keyExtractor={item => item.diningId || item._id}
          onEndReached={loadMoreBookmarks}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            hasMore && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#4386AD" />
              </View>
            )
          }
          // Add ListEmptyComponent to handle both no bookmarks and no search results
          ListEmptyComponent={
            !loading && (
              <View style={styles.noResultsContainer}>
                <Text style={styles.noResultsText}>
                  {searchQuery ? `No results for "${searchQuery}"` : "You don't have any bookmarks yet."}
                </Text>
              </View>
            )
          }
        />
      )}

      <Modal
        animationType="fade"
        transparent={true}
        visible={isImageModalVisible}
        onRequestClose={() => setImageModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.imageModalContainer}
          activeOpacity={1}
          onPressOut={() => setImageModalVisible(false)}
        >
          <Image source={{ uri: selectedImage }} style={styles.expandedImage} />
          <TouchableOpacity style={styles.imageModalCloseButton} onPress={() => setImageModalVisible(false)}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  )
}

export default DiningBookmark

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    borderColor: '#045D91'
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
  card: {
    backgroundColor: '#F8FAFC',
    borderColor: '#4386AD',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 20,
    overflow: 'hidden',
    padding: 10
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
  closeButtonText: {
    color: 'white',
    fontSize: 16
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
