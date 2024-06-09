import { createStackNavigator } from '@react-navigation/stack'
import MyRecommendations from './my-recommendation'
import React from 'react'

const Stack = createStackNavigator()

const _layout = () => {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="my-recommendations" component={MyRecommendations} options={{ headerShown: false }} />
    </Stack.Navigator>
  )
}

export default _layout
