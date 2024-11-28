import { View, Text, Modal, TouchableWithoutFeedback, StyleSheet, Image, TouchableOpacity } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import React from 'react'

const ProfileModal = ({ visible, user, onClose, onRemoveFriend }) => {
  if (!user) return null

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.profileModalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={onClose} style={styles.closeButtonContainer}>
                  <View style={styles.closeButtonContent}>
                    <MaterialIcons name="close" size={24} color="#999999" />
                    <Text style={styles.closeText}>Close</Text>
                  </View>
                </TouchableOpacity>
                {onRemoveFriend && (
                  <TouchableOpacity onPress={() => onRemoveFriend(user._id)}>
                    <MaterialIcons name="delete" size={24} color="red" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.profileImageContainer}>
                <Image
                  source={
                    user.profilePicture
                      ? { uri: user.profilePicture }
                      : { uri: 'https://avatars.githubusercontent.com/u/92809183?v=4' }
                  }
                  style={styles.profilePictureLarge}
                />
              </View>
              <Text style={styles.profileName}>
                {user.firstName} {user.lastName}
              </Text>
              <View style={styles.profileDetailsContainer}>
                <View style={styles.detailRow}>
                  <MaterialIcons name="email" size={24} color="#555555" />
                  <View style={styles.detailContainer}>
                    <Text style={styles.detailLabel}>E-mail address</Text>
                    <Text style={styles.detailValue}>{user.email}</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <MaterialIcons name="person" size={24} color="#555555" />
                  <View style={styles.detailContainer}>
                    <Text style={styles.detailLabel}>Role</Text>
                    <Text style={styles.detailValue}>{user.role}</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <MaterialIcons name="airlines" size={24} color="#555555" />
                  <View style={styles.detailContainer}>
                    <Text style={styles.detailLabel}>Airline</Text>
                    <Text style={styles.detailValue}>{user.airline}</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <MaterialIcons name="pin-drop" size={24} color="#555555" />
                  <View style={styles.detailContainer}>
                    <Text style={styles.detailLabel}>Homebase</Text>
                    <Text style={styles.detailValue}>{user.homebase}</Text>
                  </View>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  profileModalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  closeButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  closeText: {
    fontSize: 16,
    color: '#999999'
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 10
  },
  profilePictureLarge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#CCCCCC'
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15
  },
  profileDetailsContainer: {
    marginVertical: 10,
    marginHorizontal: 15
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  detailContainer: {
    marginLeft: 10
  },
  detailLabel: {
    fontWeight: 'bold',
    marginLeft: 10,
    marginRight: 5
  },
  detailValue: {
    marginLeft: 10,
    color: '#555555'
  }
})

export default ProfileModal
