import { View, Text, ScrollView, StyleSheet, SafeAreaView, Image, TouchableOpacity } from 'react-native'
import ConnectivityService from '@/services/utils/connectivity-service'
import { getAllRosterEntries } from '@/services/utils/database'
import { useFocusEffect } from '@react-navigation/native'
import AirportSearch from '@/components/airport-search'
import React, { useState, useCallback } from 'react'
import { useGlobalStore } from '../../store/store'
import * as SecureStore from 'expo-secure-store'
import { AntDesign } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import moment from 'moment-timezone'

const Destination = () => {
  const [roster, setRoster] = useState([])
  const router = useRouter()
  const setSelectedAirport = useGlobalStore(state => state.setSelectedAirport)

  const checkInternetConnection = async action => {
    const isConnected = await ConnectivityService.checkConnection({ showAlert: true })
    if (isConnected) {
      action()
    }
  }

  const handleSelectAirport = async airport => {
    if (airport) {
      await checkInternetConnection(() => {
        setSelectedAirport(airport)
        router.push('destinations/events')
      })
    }
  }

  const fetchRoster = async () => {
    try {
      const userId = await SecureStore.getItemAsync('userId')
      if (!userId) {
        console.error('User ID not found')
        return
      }

      const startOfToday = moment().startOf('day').toISOString()
      const endOf30Days = moment().startOf('day').add(30, 'days').toISOString()

      const allRosterEntries = await getAllRosterEntries(userId)

      const uniqueDestinations = new Set()
      const filteredRoster = allRosterEntries.filter(entry => {
        const departureTime = moment(entry.departureTime).toISOString()

        const isWithin30Days = departureTime >= startOfToday && departureTime <= endOf30Days

        const hasValidObjectIds = entry.origin.objectId && entry.destination.objectId

        const destinationKey = entry.destination.objectId
        const isUniqueDestination = !uniqueDestinations.has(destinationKey)

        if (isWithin30Days && hasValidObjectIds && isUniqueDestination) {
          uniqueDestinations.add(destinationKey)
          return true
        }

        return false
      })
      setRoster(filteredRoster)
    } catch (error) {
      console.error('Error fetching roster data from SQLite:', error)
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchRoster()
    }, [])
  )

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <AirportSearch placeholder="Search for Airports" onSelect={handleSelectAirport} />
        <Text style={styles.journeyHeader}>Journey Ahead: Your next stops</Text>

        {/* Bookmarks */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => checkInternetConnection(() => router.push('bookmarks/dining-bookmark'))}
        >
          <View style={styles.buttonTextContainer}>
            <AntDesign name="book" size={16} color="#4386AD" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>My Bookmarks</Text>
          </View>
          <AntDesign name="right" size={16} color="#4386AD" style={styles.arrowIcon} />
        </TouchableOpacity>

        {/* Recommendations */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => checkInternetConnection(() => router.push('recommendations/my-recommendation'))}
        >
          <View style={styles.buttonTextContainer}>
            <AntDesign name="staro" size={16} color="#4386AD" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>My Recommendations</Text>
          </View>
          <AntDesign name="right" size={16} color="#4386AD" style={styles.arrowIcon} />
        </TouchableOpacity>

        {/* Destinations List */}
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
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
    borderBottomWidth: 0
  },
  rosterTextContainer: {
    flex: 1,
    marginRight: 10
  },
  rosterText: {
    fontSize: 16,
    flexWrap: 'wrap'
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
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3
  },
  buttonTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10
  },
  buttonIcon: {
    marginRight: 10
  },
  buttonText: {
    fontSize: 16,
    color: 'black'
  }
})

export default Destination
