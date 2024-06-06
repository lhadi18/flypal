import { StyleSheet } from 'react-native'
import { Stack } from 'expo-router'
import React from 'react'

const RootLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false, headerBackTitle: 'Back' }}></Stack.Screen>
      <Stack.Screen name="(auth)" options={{ headerShown: false }}></Stack.Screen>
      <Stack.Screen name="(tabs)" options={{ headerShown: false, headerBackTitle: 'Back' }}></Stack.Screen>
      <Stack.Screen
        name="destinations"
        options={{ headerTitle: 'Destination Information', headerShown: true, headerBackTitle: 'Back' }}
      ></Stack.Screen>
    </Stack>
  )
}

export default RootLayout

const styles = StyleSheet.create({})
