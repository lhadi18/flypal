import React, { useState, useCallback, forwardRef, useImperativeHandle, useEffect } from 'react'
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import axios from 'axios'
import _ from 'lodash'

const StyledAirportSearch = forwardRef(({ placeholder, onSelect, initialValue }, ref) => {
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
        `https://f002-2001-4458-c00f-951c-4c78-3e22-9ba3-a6ad.ngrok-free.app/api/airport/getAirport`,
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
    <View style={styles.inputContainer}>
      <View style={styles.searchContainer}>
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
  inputContainer: {
    width: '100%'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: 'white',
    borderColor: 'grey',
    height: 40
  },
  input: {
    height: 40,
    flex: 1,
    fontSize: 14,
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
    borderColor: 'grey',
    borderRadius: 5,
    backgroundColor: 'white',
    marginTop: 10
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10
  },
  separator: {
    height: 1,
    backgroundColor: 'grey'
  },
  itemText: {
    fontSize: 14,
    color: 'black'
  }
})

export default StyledAirportSearch
