import { View, Text, ScrollView, StyleSheet, SafeAreaView, Image, TouchableOpacity } from 'react-native'
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

  useEffect(() => {
    const fetchRoster = async () => {
      try {
        const userId = await SecureStore.getItemAsync('userId')
        if (!userId) {
          console.error('User ID not found')
          return
        }

        const response = await axios.get('https://b113-103-18-0-17.ngrok-free.app/api/roster/getNext30DaysRoster', {
          params: { userId }
        })
        setRoster(response.data)
      } catch (error) {
        console.error(error)
      }
    }

    fetchRoster()
  }, [])

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <AirportSearch placeholder="Search for Airports" onSelect={handleSelectAirport} />
        <Text style={styles.journeyHeader}>Journey Ahead: Your next stops</Text>
        {roster.length > 0 ? (
          <View style={styles.rosterContainer}>
            {roster.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.rosterItem, index === 0 && styles.firstRosterItem]}
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
    backgroundColor: '#f8f8f8'
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
    padding: 10
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
  }
})

export default Destination
