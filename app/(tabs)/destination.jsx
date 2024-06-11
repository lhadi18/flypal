import { View, Text, ScrollView, StyleSheet, SafeAreaView, Image, TouchableOpacity } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import AirportSearch from '@/components/airport-search'
import { useGlobalStore } from '../../store/store'
import React, { useState, useEffect } from 'react'
import * as SecureStore from 'expo-secure-store'
import { AntDesign } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import axios from 'axios'

const Destination = () => {
  const [roster, setRoster] = useState([])
  const router = useRouter()
  const setSelectedAirport = useGlobalStore(state => state.setSelectedAirport)

  const handleSelectAirport = airport => {
    if (airport) {
      setSelectedAirport(airport)
      router.push('destinations/events')
    }
  }

  const fetchRoster = async () => {
    try {
      const userId = await SecureStore.getItemAsync('userId')
      if (!userId) {
        console.error('User ID not found')
        return
      }

      const response = await axios.get(
        'https://cfff-2402-1980-8288-81b8-9dfc-3344-2fa3-9857.ngrok-free.app/api/roster/getNext30DaysRoster',
        {
          params: { userId }
        }
      )
      setRoster(response.data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    fetchRoster()
  }, [])

  useFocusEffect(
    React.useCallback(() => {
      fetchRoster()
    }, [])
  )

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <AirportSearch placeholder="Search for Airports" onSelect={handleSelectAirport} />
        <Text style={styles.journeyHeader}>Journey Ahead: Your next stops</Text>
        <TouchableOpacity style={styles.button} onPress={() => null}>
          <View style={styles.buttonTextContainer}>
            <AntDesign name="book" size={16} color="#4386AD" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>My Bookmarks</Text>
          </View>
          <AntDesign name="right" size={16} color="#4386AD" style={styles.arrowIcon} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={() => router.push('recommendations/my-recommendation')}>
          <View style={styles.buttonTextContainer}>
            <AntDesign name="staro" size={16} color="#4386AD" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>My Recommendations</Text>
          </View>
          <AntDesign name="right" size={16} color="#4386AD" style={styles.arrowIcon} />
        </TouchableOpacity>
        {roster.length > 0 ? (
          <View style={styles.rosterContainer}>
            {roster.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.rosterItem,
                  index === 0 && styles.firstRosterItem,
                  index === roster.length - 1 && styles.lastRosterItem
                ]}
                onPress={() => handleSelectAirport(item.destination)}
              >
                <View style={styles.rosterTextContainer}>
                  <Text style={styles.rosterText}>
                    ({item.destination.IATA}/{item.destination.ICAO}) {item.destination.name}
                  </Text>
                  <Text style={styles.rosterSubText}>
                    {item.destination.city}, {item.destination.country}
                  </Text>
                </View>
                <AntDesign name="right" size={16} color="#4386AD" style={styles.arrowIcon} />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.noDestinationsContainer}>
            <Image source={require('../../assets/images/paper-airplane.png')} style={styles.noDestinationsImage} />
            <Text style={styles.noDestinationsText}>No upcoming destinations in the next 30 days.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'white'
  },
  container: {
    flexGrow: 1,
    padding: 20
  },
  linkText: {
    fontSize: 18,
    color: '#007AFF',
    marginBottom: 20
  },
  airportList: {
    marginTop: 20
  },
  airportItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc'
  },
  airportText: {
    fontSize: 16
  },
  journeyHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 30
  },
  rosterContainer: {
    marginTop: 20,
    backgroundColor: '#F8FAFC',
    borderColor: '#4386AD',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    shadowColor: '#000', // Add shadow color
    shadowOffset: { width: 0, height: 2 }, // Add shadow offset
    shadowOpacity: 0.2, // Add shadow opacity
    shadowRadius: 4, // Add shadow radius
    elevation: 3 // Add elevation for Android shadow
  },
  rosterList: {
    marginTop: 20
  },
  rosterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#4386AD'
  },
  firstRosterItem: {
    paddingTop: 10,
    paddingBottom: 15
  },
  lastRosterItem: {
    borderBottomWidth: 0 // Remove the line for the last item
  },
  rosterTextContainer: {
    flex: 1,
    marginRight: 10 // Ensure some space between text and arrow
  },
  rosterText: {
    fontSize: 16,
    flexWrap: 'wrap' // Ensure text wraps within the container
  },
  rosterSubText: {
    fontSize: 14,
    color: '#666'
  },
  arrowIcon: {
    marginLeft: 'auto'
  },
  noDestinationsContainer: {
    alignItems: 'center',
    marginTop: 20
  },
  noDestinationsImage: {
    width: 150,
    height: 150,
    marginBottom: 10
  },
  noDestinationsText: {
    fontSize: 16,
    color: '#666'
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#4386AD',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 10,
    marginTop: 20, // Reduced margin to decrease distance between buttons
    shadowColor: '#000', // Add shadow color
    shadowOffset: { width: 0, height: 2 }, // Add shadow offset
    shadowOpacity: 0.2, // Add shadow opacity
    shadowRadius: 4, // Add shadow radius
    elevation: 3 // Add elevation for Android shadow
  },
  buttonTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center', // Align text and icon
    marginRight: 10 // Ensure some space between text and arrow
  },
  buttonIcon: {
    marginRight: 10 // Space between icon and text
  },
  buttonText: {
    fontSize: 16,
    color: 'black'
  }
})

export default Destination
