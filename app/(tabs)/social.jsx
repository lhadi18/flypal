import React, { useState } from 'react';
import { View, Text, useWindowDimensions, StyleSheet, TextInput, TouchableOpacity, Modal } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { MaterialIcons } from '@expo/vector-icons';
import { MenuProvider, Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';

const Connection = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (option) => {
    console.log(option);
    setIsOpen(false);
  };

  return (
    
    <View style={styles.tabContent}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search friend..."
        placeholderTextColor='grey'
      />
      <View>
        <View style={styles.cardContainer}>
          <View style={styles.profileContainer}>
            <View style={styles.profilePicture} />
            <View style={styles.profileInfo}>
              <Text style={styles.name}>John Doe</Text>
              <Text style={styles.role}>Pilot Captain</Text>
              <TouchableOpacity style={styles.messageButton}>
                <MaterialIcons name="message" size={12} color="white" />
                <Text style={styles.buttonText}>Message</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity onPress={toggleMenu}>
              <MaterialIcons name="more-vert" size={24} color="black" />
            </TouchableOpacity>
            {isOpen && (
              <View style={styles.menuOptions}>
                <TouchableOpacity onPress={() => handleOptionClick('View Profile')}>
                  <Text style={{ padding: 10, color: 'black' }}>View Profile</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleOptionClick('Remove Friend')}>
                  <Text style={{ padding: 10, color: 'red' }}>Remove Friend</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
  </View>
  )
};

const Message = () => (
  <View style={styles.tabContent}>
    <Text style={styles.tabText}>Message</Text>
  </View>
);

const Request = () => (
  <View style={styles.tabContent}>
    <Text style={styles.tabText}>Request</Text>
  </View>
);

const renderScene = SceneMap({
  connection: Connection,
  message: Message,
  request: Request,
});

const Social = () => {
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'connection', title: 'Connection' },
    { key: 'message', title: 'Message' },
    { key: 'request', title: 'Request' },
  ]);

  const renderTabBar = props => (
    <TabBar
      {...props}
      style={styles.tabBar}
      labelStyle={styles.tabLabel}
      indicatorStyle={styles.tabIndicator}
    />
  );

  return (
    <View style={styles.container}>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: useWindowDimensions().width }}
        renderTabBar={renderTabBar}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: '#045D91',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  tabLabel: {
    color: 'white',
  },
  tabContent: {
    flex: 1,
    
  },
  tabText: {
    fontSize: 18,
  },
  tabIndicator: {
    backgroundColor: 'white',
    height: 5,
    borderRadius: 2, // Adjust the borderRadius as needed
  },
  searchBar: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    margin: 10,
    paddingLeft: 10,
  },
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#DDDDDD',
    paddingVertical: 10,
    marginHorizontal: 20
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePicture: {
    width: 65,
    height: 65,
    borderRadius: 50,
    backgroundColor: '#CCCCCC', // Placeholder color for profile picture
    marginRight: 15,
  },
  profileInfo: {
    flexDirection: 'column',
  },
  name: {
    fontSize: 15,
    color: 'black',
  },
  role: {
    fontSize: 12,
    color: 'grey',
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#4386AD',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 5,
  },
  buttonText: {
    fontSize: 12,
    color: 'white',
    marginLeft: 10,
  },
  menuButton: {
    padding: 10,
  },
  modalContainer: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 5,
    paddingHorizontal: 10,
  },
  menuItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#DDDDDD',
  },
  menuOptions: { 
    position: 'absolute', 
    top: 30, 
    right: 0, 
    backgroundColor: 'white', 
    zIndex: 1,
    borderRadius: 10
  }
});

export default Social;

