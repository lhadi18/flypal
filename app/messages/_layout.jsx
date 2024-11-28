import { createStackNavigator } from '@react-navigation/stack'
import MessagingScreen from './messaging-screen'
import React from 'react'

const Stack = createStackNavigator()

const _layout = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="messaging-screen" component={MessagingScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  )
}

export default _layout
