// _layout.jsx
import ConnectivityService from '@/services/utils/connectivity-service'
import { View, Text, Image, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from 'expo-router'
import icons from '../../constants/icons'
import { Tabs } from 'expo-router'
import React from 'react'

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
  const navigation = useNavigation()

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
            paddingBottom: 5,
            height: 84
          }
        }}
      >
        <Tabs.Screen
          name="roster"
          options={{
            title: 'Roster',
            headerShown: true,
            headerLeft: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 18 }}>
                <TouchableOpacity
                  onPress={async () => {
                    const isConnected = await ConnectivityService.checkConnection({ showAlert: true })
                    if (isConnected) {
                      navigation.navigate('roster', { action: 'showShareModal' })
                    }
                  }}
                >
                  <Ionicons name="share" size={26} color="white" style={{ marginTop: 3 }} />
                </TouchableOpacity>
              </View>
            ),
            headerRight: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 18 }}>
                <TouchableOpacity onPress={() => navigation.navigate('roster', { action: 'pickDocument' })}>
                  <Ionicons name="cloud-upload" size={26} color="white" style={{ marginRight: 20, marginTop: 1 }} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('roster', { action: 'addEvent' })}>
                  <Ionicons name="add-circle" size={26} color="white" />
                </TouchableOpacity>
              </View>
            ),
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon={icons.roster} color={color} name="Roster" focused={focused} />
            )
          }}
        />
        <Tabs.Screen
          name="destination"
          options={{
            title: 'Destination',
            headerShown: true,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon={icons.destination} color={color} name="Destination" focused={focused} />
            )
          }}
        />
        <Tabs.Screen
          name="social"
          options={{
            title: 'Social',
            headerShown: true,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon={icons.social} color={color} name="Social" focused={focused} />
            )
          }}
        />
        <Tabs.Screen
          name="checklist"
          options={{
            title: 'Checklist',
            headerShown: true,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon={icons.checklist} color={color} name="Checklists" focused={focused} />
            )
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            headerShown: true,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon icon={icons.settings} color={color} name="Settings" focused={focused} />
            )
          }}
        />
      </Tabs>
    </>
  )
}

export default TabsLayout
