import { View, Text, StyleSheet, TouchableOpacity, TextInput, Platform, Modal, Alert, ScrollView } from 'react-native'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import DateTimePickerModal from 'react-native-modal-datetime-picker'
import { faPlus, faTrash, faEdit } from '@fortawesome/free-solid-svg-icons'
import React, { useState, useEffect } from 'react'
import * as SecureStore from 'expo-secure-store'
import { Ionicons } from '@expo/vector-icons/'
import moment from 'moment-timezone'
import axios from 'axios'

const Checklists = () => {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)
  const [newItem, setNewItem] = useState('')
  const [flightRoute, setFlightRoute] = useState('')
  const [travelDate, setTravelDate] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false)
  const [newItemText, setNewItemText] = useState('')
  const [checklistItemOptions, setChecklistItemOptions] = useState([])
  const [checklists, setChecklists] = useState([]);
  const [currentChecklist, setCurrentChecklist] = useState(null)

  const handleOpenForm = () => {
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setNewItem('')
    setFlightRoute('')
    setTravelDate(new Date())
    setChecklistItemOptions([])
  }

  const handleItemChange = text => {
    setNewItem(text)
  }

  const handleFlightRouteChange = text => {
    setFlightRoute(text)
  }

  const displayDatePicker = () => {
    setDatePickerVisibility(true)
  }

  const hideDatePicker = () => {
    setDatePickerVisibility(false)
  }

  const handleConfirm = date => {
    const formattedTravelDate = moment(date).format('YYYY-MM-DD')
    setTravelDate(formattedTravelDate)
    hideDatePicker()
  }

  const handleTravelDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || travelDate
    setShowDatePicker(Platform.OS === 'ios')
    setTravelDate(currentDate)
  }

  const handleAddChecklistItem = text => {
    if (text.trim() && checklistItemOptions.length < 20) {
      setChecklistItemOptions([...checklistItemOptions, text.trim()])
      setNewItemText('')
    }
  }

  const handleRemoveChecklistItem = index => {
    const updatedItems = [...checklistItemOptions]
    updatedItems.splice(index, 1)
    setChecklistItemOptions(updatedItems)
  }

  const leftColumnItems = checklistItemOptions.slice(0, 10)
  const rightColumnItems = checklistItemOptions.slice(10, 20)
  const isLimitReached = checklistItemOptions.length >= 20

  const handleCreateChecklist = async () => {
    const userId = await SecureStore.getItemAsync('userId')
    const checklistData = {
      userId,
      title: newItem,
      flightRoute: flightRoute,
      travelDate: travelDate,
      items: checklistItemOptions
    }
    try {
      const response = await axios.post('https://8799-103-18-0-20.ngrok-free.app/api/checklist/createChecklist', checklistData)
      console.log('Checklist created:', response.data)
      handleCloseForm()
      fetchChecklists()
    } catch (error) {
      console.error('Error saving event:', error)
      console.log(checklistData)
    }
  }

  const fetchChecklists = async () => {
    try {
        const userId = await SecureStore.getItemAsync('userId');
        console.log(userId)
        const response = await axios.get(`https://8799-103-18-0-20.ngrok-free.app/api/checklist/getChecklist`, {
          params: {
            userId
          }
        });
        setChecklists(response.data);
    } catch (error) {
        console.error('Error fetching checklists:', error);
    }
};

useEffect(() => {
  fetchChecklists();
}, []);

  const handleDeleteChecklist = checklistId => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this checklist?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              await axios.delete(`https://8799-103-18-0-20.ngrok-free.app/api/checklist/deleteChecklist/${checklistId}`)
              await fetchChecklists();
            } catch (error) {
              console.error('Error deleting checklist:', error)
            }
          }
        }
      ],
      { cancelable: true }
    )
  };

  const handleEditChecklist = checklist => {
    setCurrentChecklist(checklist)
    setIsEditFormOpen(true)
  }

  const handleUpdateChecklist = async () => {
    const userId = await SecureStore.getItemAsync('userId')
    const updatedChecklistData = {
      userId,
      title: currentChecklist.title,
      flightRoute: currentChecklist.flightRoute,
      travelDate: currentChecklist.travelDate,
      items: currentChecklist.items
    }
    try {
      const response = await axios.put(`https://8799-103-18-0-20.ngrok-free.app/api/checklist/updateChecklist/${currentChecklist._id}`, updatedChecklistData)
      console.log('Checklist updated:', response.data)
      setIsEditFormOpen(false)
      fetchChecklists()
    } catch (error) {
      console.error('Error updating checklist:', error)
    }
  }

  

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContainer}>
      <View style={styles.container}>
        <Text style={styles.header}>Item Checklist</Text>
        <TouchableOpacity style={styles.button} onPress={handleOpenForm}>
          <FontAwesomeIcon icon={faPlus} size={32} color="#fff" />
        </TouchableOpacity>
        <Modal
          visible={isFormOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={handleCloseForm}
        >
          <View style={styles.modalContainer}>
            {isFormOpen && (
              <CreateItemChecklistForm
                newItem={newItem}
                onItemChange={handleItemChange}
                flightRoute={flightRoute}
                onFlightRouteChange={handleFlightRouteChange}
                travelDate={travelDate}
                onTravelDateChange={handleTravelDateChange}
                showDatePicker={showDatePicker}
                displayDatePicker={displayDatePicker}
                hideDatePicker={hideDatePicker}
                isDatePickerVisible={isDatePickerVisible}
                setShowDatePicker={setShowDatePicker}
                handleConfirm={handleConfirm}
                newItemText={newItemText}
                setNewItemText={setNewItemText}
                onAddChecklistItem={handleAddChecklistItem}
                onRemoveChecklistItem={handleRemoveChecklistItem}
                leftColumnItems={leftColumnItems}
                rightColumnItems={rightColumnItems}
                isLimitReached={isLimitReached}
                onClose={handleCloseForm}
                onCreate={handleCreateChecklist}
              />
            )}
            </View>
        </Modal>
        <Modal
          visible={isEditFormOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsEditFormOpen(false)}
        >
          <View style={styles.modalContainer}>
            {isEditFormOpen && (
              <EditChecklistForm
                checklist={currentChecklist}
                onItemChange={text => setCurrentChecklist({ ...currentChecklist, title: text })}
                onFlightRouteChange={text => setCurrentChecklist({ ...currentChecklist, flightRoute: text })}
                onTravelDateChange={date => setCurrentChecklist({ ...currentChecklist, travelDate: date })}
                leftColumnItems={currentChecklist.items.slice(0, 10)}
                rightColumnItems={currentChecklist.items.slice(10)}
                onAddChecklistItem={item => {
                  const updatedItems = [...currentChecklist.items, item];
                  setCurrentChecklist({ ...currentChecklist, items: updatedItems });
                }}
                onRemoveChecklistItem={index => {
                  const items = [...currentChecklist.items];
                  items.splice(index, 1);
                  setCurrentChecklist({ ...currentChecklist, items });
                }}
                displayDatePicker={displayDatePicker}
                handleConfirm={date => {
                  handleConfirm(date);
                  setCurrentChecklist({ ...currentChecklist, travelDate: date });
                }}
                hideDatePicker={hideDatePicker}
                isDatePickerVisible={isDatePickerVisible}
                newItemText={newItemText}
                setNewItemText={setNewItemText}
                onClose={() => setIsEditFormOpen(false)}
                onUpdate={handleUpdateChecklist}
              />
            )}
          </View>
        </Modal>
        {checklists.length > 0 ? (
          checklists.map((checklist, index) => (
            <View key={index} style={formStyles.box}>
              <View style={styles.rowBox}>
                <View style={styles.itemInfo}>
                  <Text style={styles.headerDetails}>{checklist.title}</Text>
                </View>
                <View style={styles.icon}>
                  <TouchableOpacity onPress={() => handleEditChecklist(checklist)} style={{paddingRight:15}}>
                    <FontAwesomeIcon icon={faEdit} size={16} color="grey" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteChecklist(checklist._id)}>
                    <FontAwesomeIcon icon={faTrash} size={16} color="red" />
                  </TouchableOpacity>
                </View>
              </View>
              <View>
                <View style={styles.rowBox}>
                  <View style={styles.columnBox}>
                    <View>
                      <Text style={styles.headerInfo}>Flight Route</Text>
                    </View>
                    <View>
                      <Text style={styles.headerDetails}>
                        {checklist.flightRoute ? checklist.flightRoute : "-"}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.columnBox}>
                    <View>
                      <Text style={styles.headerInfo}>Travel Date</Text>
                    </View>
                    <View>
                      <Text style={styles.headerDetails}>
                        {checklist.travelDate ? moment(checklist.travelDate).format('DD MMM YYYY') : "-"}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              <View>
                <Text style={formStyles.checklistTitle}>Item List</Text>
                <View style={{ flexDirection: 'row' }}>
                  <View style={{ flex: 1 }}>
                    {checklist.items.slice(0, 10).map((item, itemIndex) => (
                      <View key={itemIndex} style={formStyles.checklistItem}>
                        <Text style={formStyles.checklistItemNumber}>{itemIndex + 1}.</Text>
                        <Text style={formStyles.checklistItemText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                  <View style={{ flex: 1 }}>
                    {checklist.items.slice(10).map((item, itemIndex) => (
                      <View key={itemIndex + 10} style={formStyles.checklistItem}>
                        <Text style={formStyles.checklistItemNumber}>{itemIndex + 11}.</Text>
                        <Text style={formStyles.checklistItemText}>{item}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text>No checklists available.</Text>
        )}
      </View>
    </ScrollView>
  )
}

const EditChecklistForm = ({
  checklist,
  onItemChange,
  onFlightRouteChange,
  onAddChecklistItem,
  onClose,
  displayDatePicker,
  handleConfirm,
  hideDatePicker,
  isDatePickerVisible,
  newItemText,
  setNewItemText,
  onRemoveChecklistItem,
  leftColumnItems,
  rightColumnItems,
  isLimitReached,
  onUpdate
}) => {
  const getLocalTime = time => {
    return moment(time).format('DD/MM/YYYY')
  }

  return (
    <View style={formStyles.container}>
      <Text style={formStyles.header}>Edit Checklist</Text>
      <View style={formStyles.box}>
        <View style={formStyles.inputBox}>
          <TextInput
            style={formStyles.title}
            placeholder="Enter title..."
            placeholderTextColor="grey"
            value={checklist.title}
            onChangeText={onItemChange}
          />
          <Ionicons name="pencil" size={18} color="#000" />
        </View>
        <View style={formStyles.inputBox}>
          <TextInput
            style={formStyles.details}
            placeholder="Enter flight route..."
            placeholderTextColor="grey"
            value={checklist.flightRoute}
            onChangeText={onFlightRouteChange}
          />
          <Ionicons name="pencil" size={18} color="#000" />
        </View>
        <View style={formStyles.inputBox}>
          <TouchableOpacity onPress={displayDatePicker} style={formStyles.details}>
            <Text style={[formStyles.dateText, checklist.travelDate ? {} : { color: 'grey' }]}>
              {checklist.travelDate ? `${getLocalTime(checklist.travelDate)}` : 'Select travel date'}
            </Text>
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            onConfirm={handleConfirm}
            onCancel={hideDatePicker}
          />
          <Ionicons name="pencil" size={18} color="#000" />
        </View>
        <View>
          <Text style={formStyles.checklistTitle}>Item List</Text>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1 }}>
              {leftColumnItems.map((option, index) => (
                <View key={index} style={formStyles.checklistItem}>
                  <Text style={formStyles.checklistItemNumber}>{index + 1}.</Text>
                  <Text style={formStyles.checklistItemText}>{option}</Text>
                  <TouchableOpacity onPress={() => onRemoveChecklistItem(index)}>
                    <Ionicons name="close" size={16} color="red" />
                  </TouchableOpacity>
                </View>
              ))}
              {!isLimitReached && leftColumnItems.length < 10 && (
                <View style={formStyles.inputBox}>
                  <Ionicons name="add-circle" size={18} color="grey" />
                  <TextInput
                    style={[formStyles.input, { fontStyle: 'normal' }]}
                    placeholder="Add item..."
                    placeholderTextColor="grey"
                    onChangeText={text => setNewItemText(text)}
                    onSubmitEditing={() => {
                      onAddChecklistItem(newItemText)
                      setNewItemText('')
                    }}
                    value={newItemText}
                  />
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              {rightColumnItems.map((option, index) => (
                <View key={index + 10} style={formStyles.checklistItem}>
                  <Text style={formStyles.checklistItemNumber}>{index + 11}.</Text>
                  <Text style={formStyles.checklistItemText}>{option}</Text>
                  <TouchableOpacity onPress={() => onRemoveChecklistItem(index + 10)}>
                    <Ionicons name="close" size={16} color="red" />
                  </TouchableOpacity>
                </View>
              ))}
              {!isLimitReached && rightColumnItems.length < 10 && leftColumnItems.length === 10 && (
                <View style={formStyles.inputBox}>
                  <Ionicons name="add-circle" size={18} color="grey" />
                  <TextInput
                    style={[formStyles.input, { fontStyle: 'normal' }]}
                    placeholder="Add item..."
                    placeholderTextColor="grey"
                    onChangeText={text => setNewItemText(text)}
                    onSubmitEditing={() => {
                      onAddChecklistItem(newItemText)
                      setNewItemText('')
                    }}
                    value={newItemText}
                  />
                </View>
              )}
            </View>
          </View>
        </View>
        <View style={formStyles.buttonContainer}>
          <TouchableOpacity style={formStyles.cancelButton} onPress={onClose}>
            <Text style={formStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={formStyles.createButton} onPress={onUpdate}>
            <Text style={formStyles.createText}>Update</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const CreateItemChecklistForm = ({
  newItem,
  onItemChange,
  flightRoute,
  onFlightRouteChange,
  travelDate,
  displayDatePicker,
  hideDatePicker,
  isDatePickerVisible,
  handleConfirm,
  newItemText,
  setNewItemText,
  onAddChecklistItem,
  onRemoveChecklistItem,
  leftColumnItems,
  rightColumnItems,
  isLimitReached,
  onClose,
  onCreate
}) => {
  const getLocalTime = time => {
    return moment(time).format('DD/MM/YYYY')
  }

  return (
    <View style={formStyles.container}>
      <Text style={formStyles.header}>Create New Checklist</Text>
      <View style={formStyles.box}>
        <View style={formStyles.inputBox}>
          <TextInput
            style={formStyles.title}
            placeholder="Enter title..."
            placeholderTextColor="grey"
            value={newItem}
            onChangeText={onItemChange}
          />
          <Ionicons name="pencil" size={18} color="#000" />
        </View>
        <View style={formStyles.inputBox}>
          <TextInput
            style={formStyles.details}
            placeholder="Enter flight route..."
            placeholderTextColor="grey"
            value={flightRoute}
            onChangeText={onFlightRouteChange}
          />
          <Ionicons name="pencil" size={18} color="#000" />
        </View>
        <View style={formStyles.inputBox}>
          <TouchableOpacity onPress={displayDatePicker} style={formStyles.details}>
            <Text style={[formStyles.dateText, travelDate ? {} : { color: 'grey' }]}>
              {travelDate ? `${getLocalTime(travelDate)}` : 'Select travel date'}
            </Text>
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            onConfirm={handleConfirm}
            onCancel={hideDatePicker}
          />
          <Ionicons name="pencil" size={18} color="#000" />
        </View>
        <View>
          <Text style={formStyles.checklistTitle}>Item List</Text>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1 }}>
              {leftColumnItems.map((option, index) => (
                <View key={index} style={formStyles.checklistItem}>
                  <Text style={formStyles.checklistItemNumber}>{index + 1}.</Text>
                  <Text style={formStyles.checklistItemText}>{option}</Text>
                  <TouchableOpacity onPress={() => onRemoveChecklistItem(index)}>
                    <Ionicons name="close" size={16} color="red" />
                  </TouchableOpacity>
                </View>
              ))}
              {!isLimitReached && leftColumnItems.length < 10 && (
                <View style={formStyles.inputBox}>
                  <Ionicons name="add-circle" size={18} color="grey" />
                  <TextInput
                    style={[formStyles.input, { fontStyle: 'normal' }]}
                    placeholder="Add item..."
                    placeholderTextColor="grey"
                    onChangeText={text => setNewItemText(text)}
                    onSubmitEditing={() => {
                      onAddChecklistItem(newItemText)
                      setNewItemText('')
                    }}
                    value={newItemText}
                  />
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              {rightColumnItems.map((option, index) => (
                <View key={index + 10} style={formStyles.checklistItem}>
                  <Text style={formStyles.checklistItemNumber}>{index + 11}.</Text>
                  <Text style={formStyles.checklistItemText}>{option}</Text>
                  <TouchableOpacity onPress={() => onRemoveChecklistItem(index + 10)}>
                    <Ionicons name="close" size={16} color="red" />
                  </TouchableOpacity>
                </View>
              ))}
              {!isLimitReached && rightColumnItems.length < 10 && leftColumnItems.length === 10 && (
                <View style={formStyles.inputBox}>
                  <Ionicons name="add-circle" size={18} color="grey" />
                  <TextInput
                    style={[formStyles.input, { fontStyle: 'normal' }]}
                    placeholder="Add item..."
                    placeholderTextColor="grey"
                    onChangeText={text => setNewItemText(text)}
                    onSubmitEditing={() => {
                      onAddChecklistItem(newItemText)
                      setNewItemText('')
                    }}
                    value={newItemText}
                  />
                </View>
              )}
            </View>
          </View>
        </View>
        <View style={formStyles.buttonContainer}>
          <TouchableOpacity style={formStyles.cancelButton} onPress={onClose}>
            <Text style={formStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={formStyles.createButton} onPress={onCreate}>
            <Text style={formStyles.createText}>Create</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative'
  },
  scrollViewContainer: {
    flexGrow: 1,
  },
  header: {
    fontSize: 18,
    fontWeight: '600',
    padding: 15
  },
  button: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#045D91',
    justifyContent: 'center',
    alignItems: 'center',
    bottom: 30,
    right: 30,
    elevation: 5
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  itemInfo: {
    borderBottomWidth: 1,
    borderBottomColor: '#5F5F5F',
  },
  rowBox: {
    flexDirection: 'row',
    marginBottom: 10
  },
  columnBox: {
    flex: 1,
    flexDirection: 'column',
  },
  headerInfo: {
    color: '#2F80ED',
    fontSize: 12,
  },
  headerDetails: {
    fontWeight: 600
  },
  icon: {
    marginLeft: 'auto',
    flexDirection: 'row'
  },
})

const formStyles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    position: 'relative',
    margin: 10
  },
  box: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderColor: '#4386AD',
    borderWidth: 1,
    shadowColor: '#000',
    marginHorizontal: 20,
    padding: 10,
    marginBottom: 20,
    shadowOpacity: 0.25,
    shadowOffset: { width: 2, height: 4 }
  },
  header: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 30,
    paddingVertical: 15
  },
  title: {
    marginBottom: 10,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#5F5F5F',
    fontSize: 12,
    alignItems: 'stretch'
  },
  details: {
    marginBottom: 10,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#5F5F5F',
    fontSize: 12
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'stretch'
  },
  input: {
    paddingLeft: 8,
    width: '80%',
    fontSize: 12
  },
  dateButton: {
    backgroundColor: '#045D91',
    borderRadius: 5
  },
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    borderColor: '#045D91',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 20,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5
  },
  dateText: {
    color: 'black',
    fontSize: 12,
    marginRight: 10
  },
  checklistTitle: {
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 5,
    color: '#6A6A6A'
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5
  },
  checklistItemText: {
    marginLeft: 10,
    fontSize: 12
  },
  removeIcon: {
    fontSize: 18,
    color: '#ccc',
    marginLeft: 'auto'
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20
  },
  createButton: {
    backgroundColor: '#045D91',
    borderRadius: 10,
    width: '45%',
    marginHorizontal: 5,
    padding: 5
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderColor: '#656565',
    borderWidth: 1,
    borderRadius: 10,
    width: '45%',
    marginHorizontal: 5,
    padding: 5
  },
  createText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center'
  },
  cancelText: {
    color: '#656565',
    fontWeight: '600',
    textAlign: 'center'
  }
})

export default Checklists
