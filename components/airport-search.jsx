import React, { useState, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react'
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native'
import { getAirportsFromDatabase } from '../services/utils/database'
import Ionicons from 'react-native-vector-icons/Ionicons'
import NetInfo from '@react-native-community/netinfo'
import axios from 'axios'
import _ from 'lodash'

const AirportSearch = forwardRef(({ placeholder, onSelect, initialValue }, ref) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selectedAirport, setSelectedAirport] = useState(initialValue || null)
  const [noResults, setNoResults] = useState(false)

  useImperativeHandle(ref, () => ({
    clearSelection
  }))

  useEffect(() => {
    if (initialValue) {
      setQuery(initialValue.label)
      setSelectedAirport(initialValue)
    }
  }, [initialValue])

  const fetchAirports = async searchQuery => {
    // const isConnected = await NetInfo.fetch().then(state => state.isConnected)
    const isConnected = false

    if (isConnected) {
      // try {
      //   const response = await axios.get(
      //     `https://40c7-115-164-76-186.ngrok-free.app/api/airport/getAirport`,
      //     { params: { query: searchQuery } }
      //   )
      //   if (response.data.length === 0) {
      //     setNoResults(true)
      //   } else {
      //     setNoResults(false)
      //     setResults(response.data)
      //   }
      // } catch (error) {
      //   console.error('Error fetching airports online:', error)
      //   setNoResults(true)
      // }
    } else {
      try {
        const offlineResults = await getAirportsFromDatabase(searchQuery)

        setResults(offlineResults)
        setNoResults(offlineResults.length === 0)
      } catch (error) {
        console.error('Error fetching airports offline:', error)
        setNoResults(true)
      }
    }
  }

  const debouncedFetchAirports = useCallback(_.debounce(fetchAirports, 300), [])

  const handleSearch = text => {
    setQuery(text)
    if (text.length >= 3) {
      debouncedFetchAirports(text)
    } else {
      setResults([])
      setNoResults(false)
    }
  }

  const handleSelect = airport => {
    setSelectedAirport(airport)
    setQuery(airport.label)
    setResults([])
    setNoResults(false)
    onSelect(airport)
  }

  const clearSelection = () => {
    setSelectedAirport(null)
    setQuery('')
    setResults([])
    setNoResults(false)
    onSelect(null)
  }

  return (
    <View>
      <View style={styles.searchContainer}>
        <Ionicons name="location" size={20} color="#045D91" style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={query}
          placeholderTextColor={'grey'}
          onChangeText={handleSearch}
          editable={!selectedAirport}
        />
        {selectedAirport && (
          <TouchableOpacity onPress={clearSelection} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="grey" />
          </TouchableOpacity>
        )}
      </View>
      {results.length > 0 && (
        <View style={styles.resultsContainer}>
          {results.map((item, index) => (
            <View key={item.value}>
              <TouchableOpacity style={styles.resultItem} onPress={() => handleSelect(item)}>
                <Text style={styles.itemText}>{item.label}</Text>
              </TouchableOpacity>
              {index < results.length - 1 && <View style={styles.separator} />}
            </View>
          ))}
        </View>
      )}
      {noResults && (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No airports found</Text>
        </View>
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 20,
    backgroundColor: 'white',
    borderColor: '#045D91',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  input: {
    height: 40,
    flex: 1,
    fontSize: 16,
    color: 'black'
  },
  icon: {
    marginRight: 10
  },
  clearButton: {
    marginLeft: 10
  },
  resultsContainer: {
    borderWidth: 1,
    borderColor: '#4386AD',
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    marginBottom: 10
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15
  },
  separator: {
    height: 1,
    backgroundColor: '#4386AD'
  },
  itemText: {
    fontSize: 16
  },
  noResultsContainer: {
    marginTop: 10,
    alignItems: 'center'
  },
  noResultsText: {
    fontSize: 16,
    color: 'grey'
  }
})

export default AirportSearch
