import { StyleSheet, Text, View, TouchableOpacity, Modal, SafeAreaView, ScrollView } from 'react-native'
import { dietaryOptions } from '../constants/dietary-options'
import { BlurView } from 'expo-blur'
import React from 'react'

const DietaryFilterModal = ({ isVisible, onClose, selectedOption, onSelectOption }) => {
  const handleSelectOption = option => {
    onSelectOption(option)
  }

  return (
    <SafeAreaView style={styles.container}>
      <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
        <BlurView intensity={50} style={styles.blurView}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Select Dietary Preference</Text>
            <ScrollView contentContainerStyle={styles.optionsContainer}>
              {dietaryOptions.map(option => (
                <TouchableOpacity
                  key={option}
                  style={[styles.optionButton, selectedOption === option && styles.optionButtonSelected]}
                  onPress={() => handleSelectOption(option)}
                >
                  <Text style={[styles.optionText, selectedOption === option && styles.optionTextSelected]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.applyButton]} onPress={onClose}>
                <Text style={styles.applyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>
    </SafeAreaView>
  )
}

export default DietaryFilterModal

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  blurView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalView: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  optionsContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingBottom: 20
  },
  optionButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    borderColor: '#4386AD',
    borderWidth: 1,
    marginVertical: 5,
    width: '100%',
    alignItems: 'center'
  },
  optionButtonSelected: {
    backgroundColor: '#4386AD'
  },
  optionText: {
    color: '#4386AD',
    fontSize: 16,
    fontWeight: 'bold'
  },
  optionTextSelected: {
    color: '#FFF'
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    width: '100%'
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginHorizontal: 5,
    width: '45%',
    alignItems: 'center'
  },
  cancelButton: {
    backgroundColor: '#FFF',
    borderColor: 'grey',
    borderWidth: 1
  },
  cancelButtonText: {
    color: 'grey',
    fontWeight: 'bold'
  },
  applyButton: {
    backgroundColor: '#045D91'
  },
  applyButtonText: {
    color: '#FFF',
    fontWeight: 'bold'
  }
})
