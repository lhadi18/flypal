import { View, Text, StyleSheet, Animated } from 'react-native'
import React, { useState, useEffect } from 'react'

const Toast = ({ visible, message, duration = 3000, onHide }) => {
  const [slideAnim] = useState(new Animated.Value(-100))

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start(() => {
        setTimeout(() => {
          Animated.timing(slideAnim, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true
          }).start(() => {
            if (onHide) {
              onHide()
            }
          })
        }, duration)
      })
    }
  }, [visible, slideAnim, duration, onHide])

  if (!visible) {
    return null
  }

  return (
    <Animated.View style={[styles.toastContainer, { transform: [{ translateY: slideAnim }] }]}>
      <Text style={styles.toastMessage}>{message}</Text>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 10,
    right: 10,
    marginHorizontal: 10,
    backgroundColor: 'rgba(4, 93, 145, 0.9)',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 999
  },
  toastMessage: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center'
  }
})

export default Toast
