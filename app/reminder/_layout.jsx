import { createStackNavigator } from '@react-navigation/stack'
import ReminderSettings from './reminder-settings'
import React from 'react'

const Stack = createStackNavigator()

const _layout = () => {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen
        name="reminder-settings"
        component={ReminderSettings}
        options={{
          headerShown: false
        }}
      />
    </Stack.Navigator>
  )
}

export default _layout
