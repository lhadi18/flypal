import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { NavigationContainer } from '@react-navigation/native'
import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

import Weather from './weather'
import Events from './events'
import Dining from './dining'

const Tab = createMaterialTopTabNavigator()

export default function DestinationLayout() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarIndicatorStyle: styles.indicator,
        tabBarLabelStyle: styles.label,
        headerStyle: styles.header, // Style for the header
        headerTitleStyle: styles.headerTitle, // Style for the header title
        headerTintColor: '#ffffff' // Color for the header text and back button
      }}
    >
      <Tab.Screen name="Events" component={Events} options={{ headerTitle: 'Other Screen' }} />
      <Tab.Screen name="Dining" component={Dining} options={{ headerTitle: 'Test Screen' }} />
      <Tab.Screen name="Weather" component={Weather} options={{ headerTitle: 'Weather Screen' }} />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#045D91' // Background color of the tab bar
  },
  indicator: {
    backgroundColor: '#ffffff' // Color of the active tab indicator
  },
  label: {
    color: '#ffffff' // Color of the tab label text
  },
  header: {
    backgroundColor: '#045D91' // Background color of the header
  },
  headerTitle: {
    color: '#ffffff' // Color of the header title text
  }
})
