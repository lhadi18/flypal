import { View, TextInput, FlatList, TouchableOpacity, Text, StyleSheet } from 'react-native'
import React, { useState } from 'react'
import axios from 'axios'

const AirportSearch = ({ placeholder, onSelect }) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])

  const fetchAirports = async searchQuery => {
    try {
      const response = await axios.get(
        `https://9ad1-2402-1980-2a6-32bb-f557-bffb-2dc4-8064.ngrok-free.app/api/airport/getAirport`,
        {
          params: { query: searchQuery }
        }
      )
      setResults(response.data)
    } catch (error) {
      console.error('Error fetching airports:', error)
    }
  }

  const handleSearch = text => {
    setQuery(text)
    if (text.length >= 3) {
      fetchAirports(text)
    } else {
      setResults([])
    }
  }

  const handleSelect = airport => {
    setQuery(airport.name)
    setResults([])
    onSelect(airport)
  }

  return (
    <View>
      <TextInput style={styles.input} placeholder={placeholder} value={query} onChangeText={handleSearch} />
      {results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleSelect(item)}>
              <Text style={styles.itemText}>{item.display}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: 'white'
  },
  itemText: {
    padding: 10
  }
})

export default AirportSearch
