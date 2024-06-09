import { MaterialIcons } from '@expo/vector-icons'
import { StyleSheet, View } from 'react-native'
import React from 'react'

const NonInteractableStarRating = ({ rating, starSize = 20, starSpacing = 5 }) => {
  const starRatingOptions = [1, 2, 3, 4, 5]

  return (
    <View style={styles.stars}>
      {starRatingOptions.map(option => (
        <MaterialIcons
          key={option}
          name={rating >= option ? 'star' : 'star-border'}
          size={starSize}
          style={[rating >= option ? styles.starSelected : styles.starUnselected, { marginRight: starSpacing }]}
        />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  stars: {
    flexDirection: 'row'
  },
  starUnselected: {
    color: '#aaa'
  },
  starSelected: {
    color: '#FFD700'
  }
})

export default NonInteractableStarRating
