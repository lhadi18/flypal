import { StyleSheet, Text, View, Image, TouchableOpacity, Modal } from 'react-native'
import NonInteractableStarRating from '@/components/noninteractable-star-rating'
import { Ionicons } from '@expo/vector-icons'
import React, { useState } from 'react'
import icons from '@/constants/icons'

const RecommendationCard = ({ recommendation, openImageModal, handleLike, handleDelete, handleEdit }) => {
  const [isImageModalVisible, setImageModalVisible] = useState(false)
  const [selectedImage, setSelectedImage] = useState(null)

  const handleImagePress = imageUri => {
    setSelectedImage(imageUri)
    setImageModalVisible(true)
  }

  const closeImageModal = () => {
    setSelectedImage(null)
    setImageModalVisible(false)
  }

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => handleImagePress(recommendation.imageUrl)}>
        <Image source={{ uri: recommendation.imageUrl }} style={styles.image} />
      </TouchableOpacity>
      <View style={styles.cardContent}>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(recommendation._id)}>
          <Ionicons name="trash-outline" size={24} color="red" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.editButton} onPress={() => handleEdit(recommendation)}>
          <Ionicons name="pencil-outline" size={24} color="#045D91" />
        </TouchableOpacity>
        <Text style={styles.restaurantName}>{recommendation.restaurantName}</Text>
        <Text style={styles.address}>{recommendation.location}</Text>
        <View style={styles.ratingContainer}>
          <NonInteractableStarRating rating={recommendation.rating} />
        </View>
        <Text style={styles.reviewText}>{recommendation.review}</Text>
        {recommendation.tags && recommendation.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {recommendation.tags.map((tag, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.tagButton, recommendation.tags.includes(tag) && styles.tagButtonSelected]}
              >
                <Text style={[styles.tagButtonText, recommendation.tags.includes(tag) && styles.tagButtonTextSelected]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <View style={styles.cardFooter}>
          <Text style={styles.recommendedBy}>
            Recommended by {recommendation.user.firstName} {recommendation.user.lastName}
          </Text>
          <TouchableOpacity style={styles.likeButton} onPress={() => handleLike(recommendation._id)}>
            <Image
              source={recommendation.userHasLiked ? icons.likeFilled : icons.likeOutline}
              style={styles.likeIcon}
            />
            <Text style={styles.likeCount}>{recommendation.likes}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal visible={isImageModalVisible} transparent={true} animationType="fade" onRequestClose={closeImageModal}>
        <TouchableOpacity style={styles.modalContainer} activeOpacity={1} onPress={closeImageModal}>
          <Image source={{ uri: selectedImage }} style={styles.expandedImage} />
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

export default RecommendationCard

const styles = StyleSheet.create({
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
    color: '#555',
    marginVertical: 5,
    paddingRight: 40
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5
  },
  reviewText: {
    fontSize: 14,
    color: '#333',
    marginVertical: 5,
    lineHeight: 20
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 5
  },
  tagButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderColor: '#4386AD',
    borderWidth: 1,
    marginHorizontal: 5,
    marginBottom: 5
  },
  tagButtonSelected: {
    backgroundColor: '#4386AD'
  },
  tagButtonText: {
    color: '#4386AD',
    fontWeight: 'bold'
  },
  tagButtonTextSelected: {
    color: '#FFF'
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end'
  },
  likeIcon: {
    width: 24,
    height: 24,
    marginRight: 5
  },
  likeCount: {
    fontSize: 14,
    color: '#666'
  },
  recommendedBy: {
    fontStyle: 'italic',
    textAlign: 'left'
  },
  deleteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 10,
    zIndex: 1
  },
  editButton: {
    position: 'absolute',
    top: 10,
    right: 50,
    padding: 10,
    zIndex: 1
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  expandedImage: {
    width: '90%',
    height: '70%',
    resizeMode: 'contain'
  }
})
