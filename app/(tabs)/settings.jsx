import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native'
import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { faBell } from '@fortawesome/free-solid-svg-icons';
import { faUserGroup } from '@fortawesome/free-solid-svg-icons';
import { faKey } from '@fortawesome/free-solid-svg-icons';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { faChevronRight} from '@fortawesome/free-solid-svg-icons';

const Settings = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}></View>
      <Image
        style={styles.avatar}
        // source={{ uri: 'https://bootdey.com/img/Content/avatar/avatar6.png' }}
      />
      <View style={styles.body}>
        <View style={styles.bodyContent}>
          <Text style={styles.name}>Name</Text>
          <Text style={styles.info}>Homebase</Text>
          <Text style={styles.homebase}>City - Place</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button}>
              <View style={styles.buttonContent}>
                <FontAwesomeIcon icon={faUser} style={styles.icon} />
                <Text style={styles.textButton}>
                  User Profile
                </Text>
              </View>
              <FontAwesomeIcon icon={faChevronRight} style={styles.iconRight} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.button}>
              <View style={styles.buttonContent}>
                <FontAwesomeIcon icon={faBell} style={styles.icon} />
                <Text style={styles.textButton}>
                  Reminders
                </Text>
              </View>
              <FontAwesomeIcon icon={faChevronRight} style={styles.iconRight} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.button}>
              <View style={styles.buttonContent}>
                <FontAwesomeIcon icon={faUserGroup} style={styles.icon} />
                <Text style={styles.textButton}>
                  Connections
                </Text>
              </View>
              <FontAwesomeIcon icon={faChevronRight} style={styles.iconRight} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.button}>
              <View style={styles.buttonContent}>
                <FontAwesomeIcon icon={faKey} style={styles.icon} />
                <Text style={styles.textButton}>
                  Change Password
                </Text>
              </View>
              <FontAwesomeIcon icon={faChevronRight} style={styles.iconRight} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.button}>
              <View style={styles.buttonContent}>
                <FontAwesomeIcon icon={faTrash} style={styles.iconDelete} />
                <Text style={styles.deleteButton}>
                  Delete Account
                </Text>
              </View>
              <FontAwesomeIcon icon={faChevronRight} style={styles.iconDeleteRight} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#538FC7',
    height: 150,
  },
  avatar: {
    width: 130,
    height: 130,
    borderRadius: 63,
    borderWidth: 4,
    borderColor: 'white',
    marginBottom: 10,
    alignSelf: 'center',
    position: 'absolute',
    marginTop: 70,
  },
  body: {
    marginTop: 40,
  },
  bodyContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 10
  },
  name: {
    fontSize: 18,
    color: '#000',
    fontWeight: '600',
  },
  info: {
    fontSize: 12,
    color: '#000',
    fontWeight: '600',
  },
  homebase: {
    fontSize: 12,
    color: '#555555',
    textAlign: 'center',
  },
  button: {
    height: 50,
    flexDirection: 'row',
    paddingLeft: 20,
    alignItems: 'center',
    borderRadius: 5,
    borderBottomColor: '#FFF',
    borderBottomWidth: 1,
    width: 350,
    backgroundColor: '#045D91',
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
  },
  buttonContainer: {
    marginTop: 20,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textButton: {
    fontSize: 16,
    color: '#FFF',
  },
  deleteButton: {
    fontSize: 16,
    color: '#FF0000',
  },
  icon: {
    color: '#FFF',
    paddingRight: 20,
    height: 16,
    width: 16,
    marginRight: 10
  },
  iconDelete: {
    color: '#FF0000',
    paddingRight: 20,
    height: 16,
    width: 16,
    marginRight: 10
  },
  iconRight: {
    marginLeft: 'auto', 
    color: '#FFF'
  },
  iconDeleteRight: {
    marginLeft: 'auto', 
    color: '#FF0000'
  }
})

export default Settings
