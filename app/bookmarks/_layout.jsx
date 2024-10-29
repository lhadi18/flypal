import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { StyleSheet, Text, View } from 'react-native'
import EventsBookmark from './events-bookmark'
import DiningBookmark from './dining-bookmark'
import React from 'react'

const Tab = createMaterialTopTabNavigator()

export default function DestinationLayout() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarIndicatorStyle: styles.indicator,
        tabBarLabelStyle: styles.label,
        headerStyle: styles.header,
        headerTitleStyle: styles.headerTitle,
        headerTintColor: '#ffffff'
      }}
    >
      <Tab.Screen name="Events" component={EventsBookmark} options={{ headerTitle: 'Events' }} />
      <Tab.Screen name="Dining" component={DiningBookmark} options={{ headerTitle: 'Dining' }} />
    </Tab.Navigator>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#045D91'
  },
  indicator: {
    backgroundColor: '#ffffff'
  },
  label: {
    color: '#ffffff'
  },
  header: {
    backgroundColor: '#045D91'
  },
  headerTitle: {
    color: '#ffffff'
  }
})
