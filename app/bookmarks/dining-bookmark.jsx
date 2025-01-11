import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Alert
} from 'react-native'
import NonInteractableStarRating from '@/components/noninteractable-star-rating'
import React, { useEffect, useState, useCallback } from 'react'
import { MaterialIcons } from 'react-native-vector-icons'
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
  const [isImageModalVisible, setImageModalVisible] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)

  const selectedAirport = useGlobalStore(state => state.selectedAirport)

  const fetchUserDiningBookmarks = useCallback(
    _.debounce(async (page, query = '') => {
      setLoading(true)
      try {
        const userId = await SecureStore.getItemAsync('userId')
        const response = await axios.get(
          `https://flypal-server.click/api/bookmarks/user/${userId}/bookmarks-paginated`,
          {
            params: { page, limit: 10, search: query }
          }
        )
        console.log('API Response:', response.data)
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

  const openImageModal = imageUri => {
    setSelectedImage(imageUri)
    setImageModalVisible(true)
  }

  const handleAddressPress = (latitude, longitude) => {
    if (latitude && longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`
      Linking.openURL(url)
    }
  }

  const handleUnbookmarkPress = (diningId, sourceType, airportId) => {
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
          onPress: async () => {
            try {
              const userId = await SecureStore.getItemAsync('userId')
              const response = await axios.post('https://flypal-server.click/api/bookmarks/unbookmark', {
                userId,
                sourceType,
                diningId,
                airportId: airportId._id
              })

              if (response.status === 200) {
                setBookmarks(prevBookmarks => prevBookmarks.filter(bookmark => bookmark.diningId !== diningId))
              } else {
                console.error('Failed to unbookmark:', response.data.error)
                Alert.alert('Error', 'Failed to remove the bookmark. Please try again.')
              }
            } catch (error) {
              console.error('Error unbookmarking dining:', error)
              Alert.alert('Error', 'Failed to remove the bookmark. Please try again.')
            }
          }
        }
      ],
      { cancelable: true }
    )
  }

  const renderBookmark = ({ item: bookmark }) => (
    <View key={bookmark.diningId || bookmark._id} style={styles.card}>
      <TouchableOpacity onPress={() => openImageModal(bookmark.imageUrl || PLACEHOLDER_IMAGE_URL)}>
        <Image source={{ uri: bookmark.imageUrl || PLACEHOLDER_IMAGE_URL }} style={styles.image} />
      </TouchableOpacity>
      <View style={styles.cardContent}>
        <TouchableOpacity
          style={styles.bookmarkButton}
          onPress={() => handleUnbookmarkPress(bookmark.diningId, bookmark.sourceType, bookmark.airportId)}
        >
          <Image source={icons.bookmarkFilled} style={styles.bookmarkIcon} />
        </TouchableOpacity>
        <Text style={styles.restaurantName}>{bookmark.name}</Text>

        {selectedAirport?.city && selectedAirport?.country && (
          <Text style={styles.airportLocation}>{`${bookmark.airportId.city}, ${bookmark.airportId.country}`}</Text>
        )}

        <TouchableOpacity onPress={() => handleAddressPress(bookmark.latitude, bookmark.longitude)}>
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
              <MaterialIcons name="close" size={24} color="white" />
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
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
  airportLocation: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4386AD',
    marginTop: 5
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
  }
})
