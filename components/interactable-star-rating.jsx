import { StyleSheet, View, TouchableWithoutFeedback, Animated } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import React, { useState } from 'react'

const InteractableStarRating = ({ rating, setRating, starSize = 20, starSpacing = 5 }) => {
  const starRatingOptions = [1, 2, 3, 4, 5]
  const animatedButtonScale = new Animated.Value(1)

  const handlePressIn = () => {
    Animated.spring(animatedButtonScale, {
      toValue: 1.5,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4
    }).start()
  }

  const handlePressOut = () => {
    Animated.spring(animatedButtonScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4
    }).start()
  }

  const animatedScaleStyle = {
    transform: [{ scale: animatedButtonScale }]
  }

  return (
    <View style={styles.stars}>
      {starRatingOptions.map(option => (
        <TouchableWithoutFeedback
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => setRating(option)}
          key={option}
        >
          <Animated.View style={[animatedScaleStyle, { marginRight: starSpacing }]}>
            <MaterialIcons
              name={rating >= option ? 'star' : 'star-border'}
              size={starSize}
              style={rating >= option ? styles.starSelected : styles.starUnselected}
            />
          </Animated.View>
        </TouchableWithoutFeedback>
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

export default InteractableStarRating
