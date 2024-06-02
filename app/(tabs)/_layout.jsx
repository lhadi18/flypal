import { View, Text, Image } from 'react-native'
import { Tabs } from 'expo-router'
import React from 'react'

import icons from '../../constants/icons'

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
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon={icons.roster} color={color} name="Roster" focused={focused} />
            )
          }}
        ></Tabs.Screen>
        <Tabs.Screen
          name="destination"
          options={{
            title: 'Destination',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon={icons.destination} color={color} name="Destination" focused={focused} />
            )
          }}
        ></Tabs.Screen>
        <Tabs.Screen
          name="social"
          options={{
            title: 'Social',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => <TabIcon icon={null} color={color} name="Social" focused={focused} />
          }}
        ></Tabs.Screen>
        <Tabs.Screen
          name="checklist"
          options={{
            title: 'Checklist',
            headerShown: false,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon={null} color={color} name="Checklists" focused={focused} />
            )
          }}
        ></Tabs.Screen>
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            headerShown: false,
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
