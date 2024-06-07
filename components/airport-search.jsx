import React, { useState, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react'
import { View, TextInput, ScrollView, TouchableOpacity, Text, StyleSheet } from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import axios from 'axios'
import _ from 'lodash'

const AirportSearch = forwardRef(({ placeholder, onSelect, initialValue }, ref) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [selectedAirport, setSelectedAirport] = useState(initialValue || null)

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
    try {
      const response = await axios.get(
        `https://cfff-2402-1980-8288-81b8-9dfc-3344-2fa3-9857.ngrok-free.app/api/airport/getAirport`,
        {
          params: { query: searchQuery }
        }
      )
      setResults(response.data)
    } catch (error) {
      console.error('Error fetching airports:', error)
    }
  }

  const debouncedFetchAirports = useCallback(_.debounce(fetchAirports, 300), [])

  const handleSearch = text => {
    setQuery(text)
    if (text.length >= 3) {
      debouncedFetchAirports(text)
    } else {
      setResults([])
    }
  }

  const handleSelect = airport => {
    setSelectedAirport(airport)
    setQuery(airport.label)
    setResults([])
    onSelect(airport)
  }

  const clearSelection = () => {
    setSelectedAirport(null)
    setQuery('')
    setResults([])
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
    marginTop: 10
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
  }
})

export default AirportSearch
