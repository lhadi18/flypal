// components/SearchBar.js
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import React from 'react'

const SearchBar = ({ placeholder, value, onChangeText, onClear }) => {
  return (
    <View style={styles.searchContainer}>
      <Ionicons name="search" size={20} color="#4386AD" style={styles.icon} />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="grey"
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={onClear} style={styles.clearButton}>
          <Ionicons name="close-circle" size={20} color="grey" />
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: 'white',
    borderColor: '#045D91',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
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
  }
})

export default SearchBar
