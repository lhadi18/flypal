import React, { useEffect, useState } from 'react';
import { View, Text, useWindowDimensions, StyleSheet, TextInput, TouchableOpacity, Modal, ScrollView, FlatList } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import { MaterialIcons } from '@expo/vector-icons';
import { MenuProvider, Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import * as SecureStore from 'expo-secure-store'
import axios from 'axios';

const Connection = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState([]);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (option) => {
    console.log(option);
    setIsOpen(false);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      const userId = await SecureStore.getItemAsync('userId');
      try {
        const response = await axios.get(`https://8799-103-18-0-20.ngrok-free.app/api/users/getAllUsers/${userId}`)
        setUsers(response.data)

      } catch (error) {
        console.log("error retrieving users", error);
      }
    };

    fetchUsers();
  }, []);

  return (
    <View style={styles.tabContent}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search friend..."
        placeholderTextColor="grey"
      />
      <ScrollView>
        {users.map((user) => (
          <View key={user._id} style={styles.cardContainer}>
            <View style={styles.profileContainer}>
              <View style={styles.profilePicture} />
              <View style={styles.profileInfo}>
                <Text style={styles.name}>{`${user.firstName} ${user.lastName}`}</Text>
                <Text style={styles.role}>{user.role}</Text>
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
        ))}
      </ScrollView>
    </View>
  );
};

// const MessageInput = ({ userId, recipientId, onSendMessage }) => {
//   const [newMessage, setNewMessage] = useState('');

//   const sendMessage = async () => {
//     if (!newMessage.trim()) return;

//     try {
//       const response = await axios.post(`https://8799-103-18-0-20.ngrok-free.app/api/users/messages`, {
//         sender: userId,
//         recipient: recipientId,
//         content: newMessage,
//       });

//       onSendMessage(response.data);
//       setNewMessage('');
//     } catch (error) {
//       console.error('Error sending message:', error);
//     }
//   };

//   return (
//     <View style={styles.inputContainer}>
//       <TextInput
//         style={styles.input}
//         value={newMessage}
//         onChangeText={setNewMessage}
//         placeholder="Type a message..."
//       />
//       <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
//         <MaterialIcons name="send" size={24} color="white" />
//       </TouchableOpacity>
//     </View>
//   );
// };

const Message = () => {
  // const [userId, setUserId] = useState(null);
  // const [recipientId, setRecipientId] = useState(null);
  // const [messages, setMessages] = useState([]);
  // const [error, setError] = useState(null);

  // useEffect(() => {
  //   const fetchUserId = async () => {
  //     const userId = await SecureStore.getItemAsync('userId');
  //     setUserId(userId);
  //   };

  //   fetchUserId();
  // }, []);

  // useEffect(() => {
  //   if (userId && recipientId) {
  //     const fetchMessages = async () => {
  //       try {
  //         const response = await axios.get(`https://8799-103-18-0-20.ngrok-free.app/api/users/messages/${userId}/${recipientId}`);
  //         setMessages(response.data);
  //       } catch (error) {
  //         console.error('Error fetching messages:', error);
  //         setError('Failed to load messages');
  //       }
  //     };

  //     fetchMessages();
  //   }
  // }, [userId, recipientId]);

  // const handleSelectRecipient = (id) => {
  //   setRecipientId(id);
  //   setMessages([]); // Clear messages when a new recipient is selected
  // };

  // const handleSendMessage = (newMessage) => {
  //   setMessages([newMessage, ...messages]);
  // };

  // const renderMessageItem = ({ item }) => (
  //   <View style={styles.messageContainer}>
  //     <Text style={item.sender === userId ? styles.myMessage : styles.theirMessage}>{item.content}</Text>
  //   </View>
  // );

  return (
    <View style={styles.container}>
    </View>
  );
};

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
    height: 2,
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
  },
  messageList: {
    flex: 1,
    marginBottom: 10,
  },
  messageContainer: {
    marginVertical: 5,
    padding: 10,
    borderRadius: 10,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#daf8cb',
    padding: 10,
    borderRadius: 20,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f0f0',
    padding: 10,
    borderRadius: 20,
    marginVertical: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eaeaea',
    paddingTop: 10,
    marginHorizontal: 15,
    marginVertical: 10
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#007bff',
    borderRadius: 5,
    padding: 10,
  },
  sendButtonText: {
    color: 'white',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default Social;

