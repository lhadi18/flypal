import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUser, faBell, faUserGroup, faKey, faTrash, faChevronRight, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import * as SecureStore from 'expo-secure-store'

const Settings = () => {
  const [currentScreen, setCurrentScreen] = useState('Settings');
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  const renderSettings = () => (
    <View style={styles.container}>
      <View style={styles.header}></View>
      <Image
        style={styles.avatar}
        source={{ uri: 'https://bootdey.com/img/Content/avatar/avatar6.png' }}
      />
      <View style={styles.body}>
        <View style={styles.bodyContent}>
          <Text style={styles.name}>Name</Text>
          <Text style={styles.info}>Homebase</Text>
          <Text style={styles.homebase}>City - Place</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.button} onPress={() => setCurrentScreen('UserProfile')}>
              <View style={styles.buttonContent}>
                <FontAwesomeIcon icon={faUser} style={styles.icon} />
                <Text style={styles.textButton}>User Profile</Text>
              </View>
              <FontAwesomeIcon icon={faChevronRight} style={styles.iconRight} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.button}>
              <View style={styles.buttonContent}>
                <FontAwesomeIcon icon={faBell} style={styles.icon} />
                <Text style={styles.textButton}>Reminders</Text>
              </View>
              <FontAwesomeIcon icon={faChevronRight} style={styles.iconRight} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.button}>
              <View style={styles.buttonContent}>
                <FontAwesomeIcon icon={faUserGroup} style={styles.icon} />
                <Text style={styles.textButton}>Connections</Text>
              </View>
              <FontAwesomeIcon icon={faChevronRight} style={styles.iconRight} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.button}>
              <View style={styles.buttonContent}>
                <FontAwesomeIcon icon={faKey} style={styles.icon} />
                <Text style={styles.textButton}>Change Password</Text>
              </View>
              <FontAwesomeIcon icon={faChevronRight} style={styles.iconRight} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.button}>
              <View style={styles.buttonContent}>
                <FontAwesomeIcon icon={faTrash} style={styles.iconDelete} />
                <Text style={styles.deleteButton}>Delete Account</Text>
              </View>
              <FontAwesomeIcon icon={faChevronRight} style={styles.iconDeleteRight} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const fetchUserDetails = async () => {
    setLoading(true);
    try {
      const userId = await SecureStore.getItemAsync('userId');
      console.log(userId);
      const response = await axios.get(`https://5e21-183-171-24-71.ngrok-free.app/api/user/getUserDetails`, {
        params: { 
          userId 
        }
      });
      setUserDetails(response.data);
      console.log(response.data);
    } catch (error) {
        console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const renderUserProfile = () => (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentScreen('Settings')} style={styles.backButton}>
          <FontAwesomeIcon icon={faChevronLeft} size={24} color="white" />
        </TouchableOpacity>
      </View>
      <Image
        style={styles.avatar}
        source={{ uri: 'https://bootdey.com/img/Content/avatar/avatar6.png' }}
      />
      <View style={styles.bodyProfile}>
        <View style={styles.boxProfile}>
          <View style={styles.headerProfile}>
            <Text style={styles.headerText}>User Profile</Text>
          </View>
          {loading ? (
            <ActivityIndicator size="large" color="#0000ff" />
          ) : (
          <View style={styles.infoContainer}>
            <View style={styles.infoItem}>
              <View style={styles.infoColumn}>
                <Text style={styles.infoTitle}>First Name</Text>
                <View style={styles.infoStyles}>
                  <Text style={styles.infoValue}>{userDetails?.firstName || 'N/A'}</Text>
                </View>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoTitle}>Last Name</Text>
                <View style={styles.infoStyles}>
                  <Text style={styles.infoValue}>{userDetails?.lastName || 'N/A'}</Text>
                </View>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoTitle}>E-mail Address</Text>
                <View style={styles.infoStyles}>
                  <Text style={styles.infoValue}>{userDetails?.email || 'N/A'}</Text>
                </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoTitle}>Rank</Text>
                <View style={styles.infoStyles}>
                  <Text style={styles.infoValue}>Captain</Text>
                </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoTitle}>Homebase</Text>
                <View style={styles.infoStyles}>
                  <Text style={styles.infoValue}>KBR - Kota Bharu</Text>
                </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoTitle}>Airline</Text>
                <View style={styles.infoStyles}>
                  <Text style={styles.infoValue}>Air Asia X</Text>
                </View>
            </View>
            <View style={styles.buttonEdit}>
              <TouchableOpacity style={styles.editButton}>
                <Text style={styles.editText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
          )}
        </View>
      </View>
    </ScrollView>
  );

  return (
    <>
      {currentScreen === 'Settings' && renderSettings()}
      {currentScreen === 'UserProfile' && renderUserProfile()}
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#538FC7',
    height: 150,
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
    marginTop: 50,
  },
  bodyProfile: {
    marginTop: 70,
  },
  bodyContent: {
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
  buttonEdit: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10
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
  },
  backButton: {
    marginTop: 10,
    marginLeft: 10,
  },
  boxProfile: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderColor: '#4386AD',
    borderWidth: 1,
    shadowColor: '#000',
    marginHorizontal: 20,
    marginBottom: 20,
    shadowOpacity: 0.25,
    shadowOffset: { width: 2, height: 4 }
  },
  headerProfile: {
    backgroundColor: '#045D91',
    padding: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    alignItems: 'center',
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  infoContainer: {
    margin: 20
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  infoColumn: {
    flex: 1,
    paddingRight: 10
  }, 
  infoRow:{
    flexDirection: 'column',
    paddingRight: 10,
    marginBottom: 10
  },
  infoTitle: {
    fontWeight: 'bold',
  },
  infoValue: {
  },
  infoStyles: {
    width: "100%",
    height: 40,
    padding: 10,
    marginVertical: 5,
    backgroundColor: "white",
    color: "black",
    borderRadius: 5,
    borderColor: "#ADADAD",
    borderWidth: 1,
    elevation: 3
  },
  editButton: {
    backgroundColor: '#045D91',
    borderRadius: 10,
    width: '45%',
    marginHorizontal: 5,
    padding: 8
  },
  editText: {
    color: '#fff',
    fontWeight: '600',
    textAlign: 'center'
  }
})

export default Settings
