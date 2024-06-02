import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { View, Text, Image } from 'react-native'
import icons from '../../constants/icons'
import Checklists from './checklist'
import { Tabs } from 'expo-router'
import React from 'react'

const TopTab = createMaterialTopTabNavigator()

const TabIcon = ({ icon, color, name, focused }) => {
  return (
    <View className="items-center justify-center gap-1">
      <Image source={icon} resizeMode="contain" tintColor={color} className="w-6 h-6" />
      <Text
        style={{ color: focused ? '#007BFF' : '#000', fontWeight: focused ? '600' : '400', fontSize: 12, color: color }}
      >
        {name}
      </Text>
    </View>
  )
}

const TabsLayout = () => {
  return (
    <>
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: '#045D91' },
          headerTintColor: '#fff',
          tabBarShowLabel: false,
          tabBarActiveTintColor: '#FFFFFF',
          tabBarInactiveTintColor: '#B0C4DE',
          tabBarStyle: {
            backgroundColor: '#045D91',
            borderTopWidth: 1,
            paddingBottom: 18,
            height: 84
          }
        }}
      >
        <Tabs.Screen
          name="roster"
          options={{
            title: 'Roster',
            headerShown: true,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon={icons.roster} color={color} name="Roster" focused={focused} />
            )
          }}
        ></Tabs.Screen>
        <Tabs.Screen
          name="destination"
          options={{
            title: 'Destination',
            headerShown: true,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon={icons.destination} color={color} name="Destination" focused={focused} />
            )
          }}
        ></Tabs.Screen>
        <Tabs.Screen
          name="social"
          options={{
            title: 'Social',
            headerShown: true,
            tabBarIcon: ({ color, focused }) => <TabIcon icon={null} color={color} name="Social" focused={focused} />
          }}
        ></Tabs.Screen>
        <Tabs.Screen
          name="checklist"
          options={{
            title: 'Checklist',
            headerShown: true,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon={null} color={color} name="Checklists" focused={focused} />
            )
          }}
        ></Tabs.Screen>
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            headerShown: true,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon={icons.settings} color={color} name="Settings" focused={focused} />
            )
          }}
        ></Tabs.Screen>
      </Tabs>
    </>
  )
}

export default TabsLayout
