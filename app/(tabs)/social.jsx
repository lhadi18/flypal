import {
  View,
  Text,
  useWindowDimensions,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Modal,
  ScrollView,
  FlatList,
  Image, 
  Alert
} from 'react-native'
import { TabView, SceneMap, TabBar } from 'react-native-tab-view'
import { useFocusEffect } from '@react-navigation/native'
import React, { useEffect, useState, useRef } from 'react'
import { MaterialIcons } from '@expo/vector-icons'
import * as SecureStore from 'expo-secure-store'
import { useRouter } from 'expo-router'
import axios from 'axios'

const Connection = () => {
  const [friends, setFriends] = useState([])
  const [openUserId, setOpenUserId] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false)
  const [currentScreen, setCurrentScreen] = useState('connections')
  const [nonFriends, setNonFriends] = useState([])
  const [sentFriendRequests, setSentFriendRequests] = useState([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchAllKeyword, setSearchAllKeyword] = useState('')
  const [filteredFriends, setFilteredFriends] = useState([])
  const [filteredNonFriends, setFilteredNonFriends] = useState([])
  const router = useRouter()

  const toggleMenu = userId => {
    if (openUserId === userId) {
      setOpenUserId(null)
    } else {
      setOpenUserId(userId)
    }
  }

  const handleOptionClick = option => {
    console.log(option)
    setOpenUserId(null)
  }

  const handleCloseMenu = () => {
    setOpenUserId(null)
  }

  const openProfileModal = user => {
    setSelectedUser(user)
    setIsProfileModalVisible(true)
  }

  const closeProfileModal = () => {
    setSelectedUser(null)
    setIsProfileModalVisible(false)
  }

  const fetchFriends = async () => {
    const userId = await SecureStore.getItemAsync('userId')
    setCurrentUserId(userId)

    try {
      const response = await axios.get(
        `https://508d-2001-e68-5472-cb83-28c2-56ed-e437-8c8c.ngrok-free.app/api/users/friendList/${userId}`
      )
      setFriends(response.data)
      setFilteredFriends(response.data)
    } catch (error) {
      console.log('error retrieving friends', error)
    }
  }

  useEffect(() => {
    fetchFriends()
  }, [])

  const removeFriend = async friendId => {
    try {
      const response = await fetch(
        `https://508d-2001-e68-5472-cb83-28c2-56ed-e437-8c8c.ngrok-free.app/api/users/removeFriend`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: currentUserId, // The logged-in user's ID
            friendId: friendId // The friend's ID to be removed
          })
        }
      )

      const responseData = await response.json()
      console.log('API Response:', responseData)

      if (response.ok) {
        console.log('Friend removed successfully')
        setFriends(prevFriends => prevFriends.filter(friend => friend._id !== friendId))
        await fetchFriends()
      } else {
        console.log('Failed to remove friend:', responseData.message)
      }
    } catch (error) {
      console.log('Error removing friend:', error)
    }
  }

  const fetchNonFriends = async () => {
    try {
      const response = await axios.get(
        `https://508d-2001-e68-5472-cb83-28c2-56ed-e437-8c8c.ngrok-free.app/api/users/nonFriends/${currentUserId}`
      )

      const { nonFriends, sentFriendRequests } = response.data

      setNonFriends(nonFriends)
      setSentFriendRequests(sentFriendRequests)
      setFilteredNonFriends(nonFriends)
    } catch (error) {
      console.log('Error fetching non-friends:', error)
    }
  }

  useEffect(() => {
    if (currentScreen === 'connect') {
      fetchNonFriends()
    }
  }, [currentScreen])

  const handleSendFriendRequest = async recipientId => {
    if (!currentUserId) {
      console.log('Current user ID is not set')
      return
    }

    try {
      const response = await fetch(
        `https://508d-2001-e68-5472-cb83-28c2-56ed-e437-8c8c.ngrok-free.app/api/users/friendRequest`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            senderId: currentUserId, // The logged-in user's ID
            recipientId: recipientId // The recipient's ID
          })
        }
      )

      const responseData = await response.json()
      console.log('API Response:', responseData)

      if (response.ok) {
        console.log('Friend request sent successfully')
        setNonFriends(prev => prev.filter(user => user._id !== recipientId)) 
        await fetchNonFriends()
      } else {
        console.log('Failed to send friend request:', responseData.message)
      }
    } catch (error) {
      console.log('Error sending friend request:', error)
    }
  }

  const handleSearch = text => {
    setSearchKeyword(text)

    if (text.trim() === '') {
      setFilteredFriends(friends)
    } else {
      setFilteredFriends(
        friends.filter(friend => `${friend.firstName} ${friend.lastName}`.toLowerCase().includes(text.toLowerCase()))
      )
    }
  }

  const handleAllSearch = text => {
    setSearchAllKeyword(text)

    if (text.trim() === '') {
      setFilteredNonFriends(nonFriends)
    } else {
      setFilteredNonFriends(
        nonFriends.filter(nonFriend =>
          `${nonFriend.firstName} ${nonFriend.lastName}`.toLowerCase().includes(text.toLowerCase())
        )
      )
    }
  }

  const goToConnectPage = () => {
    setSearchKeyword(''); 
    setFilteredFriends(friends); 
    setCurrentScreen('connect');
  };
  
  const goToConnectionsPage = () => {
    setSearchAllKeyword(''); 
    setFilteredNonFriends(nonFriends); 
    setSearchKeyword(''); 
    setFilteredFriends(friends); 
    setCurrentScreen('connections');
  };

  if (currentScreen === 'connect') {
    return (
      <View style={styles.tabContent}>
        <TouchableOpacity onPress={goToConnectionsPage} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="black" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.searchBar}
          placeholder="Search user..."
          placeholderTextColor="grey"
          value={searchAllKeyword}
          onChangeText={handleAllSearch}
        />
        {nonFriends.length > 0 ? (
          filteredNonFriends.length > 0 ? (
            <FlatList
              data={filteredNonFriends}
              keyExtractor={user => user._id}
              renderItem={({ item: user }) => (
                <View style={styles.cardContainer}>
                  <View style={styles.profileContainer}>
                    {user.profilePicture ? (
                      <Image source={{ uri: user.profilePicture }} style={styles.profilePicture} />
                    ) : (
                      <View style={styles.profilePictureSmall} />
                    )}
                    <View style={styles.profileInfo}>
                      <Text style={styles.name}>{`${user.firstName} ${user.lastName}`}</Text>
                      <Text style={styles.role}>{user.role?.value}</Text>
                      {sentFriendRequests.includes(user._id) ? ( // Check if the user is in sentFriendRequests
                        <TouchableOpacity style={styles.pendingButton} disabled>
                          <MaterialIcons name="access-time" size={16} color="white" />
                          <Text style={styles.buttonText}>Pending</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={styles.connectButton}
                          onPress={() => handleSendFriendRequest(user._id)} // Call the function to send the request
                        >
                          <MaterialIcons name="person-add" size={16} color="white" />
                          <Text style={styles.buttonText}>Connect</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              )}
            />
          ) : (
            <View style={styles.noFriendsContainer}>
              <Text style={styles.noFriendsText}>No users found.</Text>
            </View>
          )
        ) : (
          <View style={styles.noFriendsContainer}>
            <Text style={styles.noFriendsText}>No users to connect with.</Text>
          </View>
        )}
      </View>
    );
  }  

  return (
    <View style={styles.tabContent}>
      <TextInput
        style={styles.searchBar}
        placeholder="Search friend..."
        placeholderTextColor="grey"
        value={searchKeyword}
        onChangeText={handleSearch}
      />
      <TouchableOpacity style={styles.addFriendButton} onPress={goToConnectPage}>
        <MaterialIcons name="person-add" size={12} color="white" />
        <Text style={styles.addFriendLink}>Connect...</Text>
      </TouchableOpacity>
      {friends.length > 0 ? (
        filteredFriends.length > 0 ? (
          <ScrollView>
            {filteredFriends.map(friend => (
              <View key={friend._id} style={styles.cardContainer}>
                <View style={styles.profileContainer}>
                  {/* Profile Picture */}
                  {friend.profilePicture ? (
                    <Image source={{ uri: friend.profilePicture }} style={styles.profilePicture} />
                  ) : (
                    <View style={styles.profilePictureSmall} />
                  )}
                  <View style={styles.profileInfo}>
                    {/* Friend's Name */}
                    <Text style={styles.name}>{`${friend.firstName} ${friend.lastName}`}</Text>
                    {/* Friend's Role */}
                    <Text style={styles.role}>{friend.role?.value}</Text>

                    {/* Message Button */}
                    <TouchableOpacity
                      style={styles.messageButton}
                      onPress={() =>
                        router.push({
                          pathname: 'messages/messaging-screen',
                          params: {
                            id: friend._id,
                            firstName: friend.firstName,
                            lastName: friend.lastName,
                            profilePicture: friend.profilePicture,
                            email: friend.email,
                            role: friend.role?.value,
                            airline: friend.airline?.Name,
                            homebase: `${friend.homebase?.IATA} - ${friend.homebase?.city}`
                          }
                        })
                      }
                    >
                      <MaterialIcons name="message" size={12} color="white" />
                      <Text style={styles.buttonText}>Message</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Friend Options */}
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity onPress={() => toggleMenu(friend._id)}>
                    <MaterialIcons name="more-vert" size={24} color="black" />
                  </TouchableOpacity>
                  {openUserId === friend._id && (
                    <View style={styles.menuOptions}>
                      <TouchableOpacity
                        style={[styles.menuButton, styles.menuItem]}
                        onPress={e => {
                          e.stopPropagation() // Prevent closing when clicking an option
                          openProfileModal(friend)
                          handleOptionClick('View Profile')
                        }}
                      >
                        <MaterialIcons style={styles.menuIcon} name="visibility" size={16} color="black" />
                        <Text style={[styles.menuText, { color: 'black' }]}>View Profile</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.menuButton}
                        onPress={e => {
                          e.stopPropagation() // Prevent closing when clicking an option
                          removeFriend(friend._id) // Call removeFriend with the friend's ID
                          handleOptionClick('Remove Friend')
                        }}
                      >
                        <MaterialIcons style={styles.menuIcon} name="delete" size={16} color="red" />
                        <Text style={[styles.menuText, { color: 'red' }]}>Remove Friend</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        ) : (
          // Case 2: Friends exist, but no matches
          <View style={styles.noFriendsContainer}>
            <Text style={styles.noFriendsText}>No friends found.</Text>
          </View>
        )
      ) : (
        // Case 1: No friends in the user's friend list
        <View style={styles.noFriendsContainer}>
          <Text style={styles.noFriendsText}>You have no connection yet. Go connect with people.</Text>
        </View>
      )}

      {openUserId && (
        <TouchableWithoutFeedback onPress={handleCloseMenu}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
      )}
      <Modal
        visible={isProfileModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeProfileModal}
      >
        <TouchableWithoutFeedback onPress={closeProfileModal}>
          <View style={styles.modalOverlay}>
            <View style={styles.profileModalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={closeProfileModal} style={styles.closeButtonContainer}>
                  <View style={styles.closeButtonContent}>
                    <MaterialIcons name="close" size={24} color="#999999" />
                    <Text style={styles.closeText}>Close</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    if (selectedUser) {
                      removeFriend(selectedUser._id)
                      closeProfileModal()
                    }
                  }}
                >
                  <MaterialIcons name="delete" size={24} color="red" />
                </TouchableOpacity>
              </View>
              {/* User Image and Details */}
              {selectedUser && (
                <>
                  <View style={styles.profileImageContainer}>
                    {selectedUser.profilePicture ? (
                      <Image source={{ uri: selectedUser.profilePicture }} style={styles.viewProfilePicture} />
                    ) : (
                      <View style={styles.profilePictureLarge} />
                    )}
                  </View>
                  <Text style={styles.profileName}>
                    {selectedUser.firstName} {selectedUser.lastName}
                  </Text>
                  <View style={styles.profileDetailsContainer}>
                    <View style={styles.detailRow}>
                      <MaterialIcons name="email" size={24} color="#555555" />
                      <View style={styles.detailContainer}>
                        <Text style={styles.detailLabel}>E-mail address</Text>
                        <Text style={styles.detailValue}>{selectedUser.email}</Text>
                      </View>
                    </View>
                    <View style={styles.detailRow}>
                      <MaterialIcons name="person" size={24} color="#555555" />
                      <View style={styles.detailContainer}>
                        <Text style={styles.detailLabel}>Role</Text>
                        <Text style={styles.detailValue}>{selectedUser.role?.value}</Text>
                      </View>
                    </View>
                    <View style={styles.detailRow}>
                      <MaterialIcons name="airlines" size={24} color="#555555" />
                      <View style={styles.detailContainer}>
                        <Text style={styles.detailLabel}>Airline</Text>
                        <Text style={styles.detailValue}>{selectedUser.airline?.Name}</Text>
                      </View>
                    </View>
                    <View style={styles.detailRow}>
                      <MaterialIcons name="pin-drop" size={24} color="#555555" />
                      <View style={styles.detailContainer}>
                        <Text style={styles.detailLabel}>Homebase</Text>
                        <Text style={styles.detailValue}>
                          {selectedUser.homebase?.IATA} - {selectedUser.homebase?.city}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {/* Message Button */}
                  <TouchableOpacity style={styles.modalMessageButton}>
                    <MaterialIcons name="message" size={16} color="white" />
                    <Text style={styles.buttonText}>Message</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  )
}

const Message = () => {
  const [conversations, setConversations] = useState([]);
  const [userId, setUserId] = useState(null);
  const [openUserId, setOpenUserId] = useState(null); // Tracks which menu is open
  const router = useRouter();
  const ws = useRef(null);

  const toggleMenu = (userId) => {
    setOpenUserId((prev) => (prev === userId ? null : userId)); // Toggle menu visibility
  };

  const fetchConversations = async () => {
    const userId = await SecureStore.getItemAsync('userId');
    setUserId(userId);

    try {
      const response = await axios.get(
        `https://508d-2001-e68-5472-cb83-28c2-56ed-e437-8c8c.ngrok-free.app/api/messages/conversations/${userId}`
      );
      const sortedConversations = response.data.sort(
        (a, b) => new Date(b.lastTimestamp) - new Date(a.lastTimestamp)
      );
      setConversations(sortedConversations);
    } catch (error) {
      console.log('Error fetching conversations:', error);
    }
  };

  const deleteConversation = async (otherUserId) => {
    try {
      const response = await axios.delete(
        'https://508d-2001-e68-5472-cb83-28c2-56ed-e437-8c8c.ngrok-free.app/api/messages/delete',
        {
          data: {
            userId, // Logged-in user ID
            otherUserId, // ID of the other user in the conversation
          },
        }
      );

      if (response.status === 200) {
        // Remove deleted conversation from local state
        setConversations((prev) =>
          prev.filter(
            (conversation) =>
              conversation.sender._id !== otherUserId &&
              conversation.recipient._id !== otherUserId
          )
        );
        Alert.alert('Success', 'Conversation deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      Alert.alert('Error', 'Failed to delete conversation');
    }
  };

  useEffect(() => {
    fetchConversations();

    ws.current = new WebSocket('ws://192.168.0.6:8080');
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'chat_message') {
        setConversations((prevConversations) => {
          let conversationFound = false;

          const updatedConversations = prevConversations.map((conversation) => {
            if (
              (conversation.sender._id === data.sender &&
                conversation.recipient._id === data.recipient) ||
              (conversation.sender._id === data.recipient &&
                conversation.recipient._id === data.sender)
            ) {
              conversationFound = true;
              return {
                ...conversation,
                lastMessage: data.content,
                lastTimestamp: data.timestamp,
              };
            }
            return conversation;
          });

          if (!conversationFound) {
            const otherUser =
              data.sender === userId ? data.recipientDetails : data.senderDetails;
            updatedConversations.push({
              sender: data.senderDetails,
              recipient: data.recipientDetails,
              lastMessage: data.content,
              lastTimestamp: data.timestamp,
            });
          }

          return updatedConversations.sort(
            (a, b) => new Date(b.lastTimestamp) - new Date(a.lastTimestamp)
          );
        });
      }
    };

    return () => {
      ws.current.close();
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchConversations();
    }, [])
  );

  return (
    <View style={styles.tabContent}>
      {conversations.length > 0 ? (
        <FlatList
          data={conversations}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => {
            const isRecipientLoggedInUser = item.recipient._id === userId;
            const otherUser = isRecipientLoggedInUser ? item.sender : item.recipient;

            const messageText = isRecipientLoggedInUser
              ? `You: ${item.lastMessage}`
              : item.lastMessage;

            return (
              <TouchableOpacity
                style={styles.cardContainer}
                onPress={() =>
                  router.push({
                    pathname: 'messages/messaging-screen',
                    params: {
                      id: otherUser._id,
                      firstName: otherUser.firstName,
                      lastName: otherUser.lastName,
                      profilePicture: otherUser.profilePicture,
                      email: otherUser.email,
                      role: otherUser.role?.value,
                      airline: otherUser.airline?.Name,
                      homebase: `${otherUser.homebase?.IATA} - ${otherUser.homebase?.city}`,
                    },
                  })
                }
              >
                <View style={styles.profileContainer}>
                  {otherUser.profilePicture ? (
                    <Image
                      source={{ uri: otherUser.profilePicture }}
                      style={styles.profilePicture}
                    />
                  ) : (
                    <View style={styles.profilePictureSmall} />
                  )}
                  <View style={styles.profileInfo}>
                    <Text style={styles.name}>{`${otherUser.firstName} ${otherUser.lastName}`}</Text>
                    <Text style={styles.role}>{messageText}</Text>
                    <Text style={styles.timestamp}>
                      {new Date(item.lastTimestamp).toLocaleString()}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity onPress={() => toggleMenu(otherUser._id)}>
                    <MaterialIcons name="more-vert" size={24} color="black" />
                  </TouchableOpacity>
                  {openUserId === otherUser._id && (
                    <View style={styles.menuOptions}>
                      <TouchableOpacity
                        style={styles.menuButton}
                        onPress={() => {
                          setOpenUserId(null); // Close menu
                          Alert.alert(
                            'Delete Conversation',
                            'Are you sure you want to delete this conversation?',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: () => deleteConversation(otherUser._id),
                              },
                            ]
                          );
                        }}
                      >
                        <MaterialIcons style={styles.menuIcon} name="delete" size={16} color="red" />
                        <Text style={[styles.menuText, { color: 'red' }]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      ) : (
        <View style={styles.noFriendsContainer}>
          <Text style={styles.noFriendsText}>No conversations yet. Start a chat!</Text>
        </View>
      )}
    </View>
  );
};

const Request = () => {
  const [requests, setRequests] = useState([])
  const [userId, setUserId] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [friendName, setFriendName] = useState('') // To store the accepted friend's name

  const fetchRequests = async () => {
    const userId = await SecureStore.getItemAsync('userId')
    setUserId(userId)
    try {
      if (userId) {
        const response = await axios.get(
          `https://508d-2001-e68-5472-cb83-28c2-56ed-e437-8c8c.ngrok-free.app/api/users/addFriend/${userId}`
        )
        setRequests(response.data)
      }
    } catch (error) {
      console.log('Error retrieving friend requests:', error)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const acceptRequest = async (friendRequestId, friendName) => {
    if (!userId) {
      console.log('Current user ID is not set')
      return
    }

    try {
      const response = await fetch(
        `https://508d-2001-e68-5472-cb83-28c2-56ed-e437-8c8c.ngrok-free.app/api/users/acceptRequest`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            senderId: friendRequestId,
            recipientId: userId
          })
        }
      )

      const responseData = await response.json()
      console.log('API Response:', responseData)

      if (response.ok) {
        console.log('Friend request accepted successfully')
        setModalVisible(true)
        await fetchRequests()
      }
    } catch (error) {
      console.log('Error accepting friend request:', error)
    }
  }

  const declineRequest = async friendRequestId => {
    if (!userId) {
      console.log('Current user ID is not set')
      return
    }

    try {
      const response = await fetch(
        `https://508d-2001-e68-5472-cb83-28c2-56ed-e437-8c8c.ngrok-free.app/api/users/declineRequest`, // Replace with your backend URL
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            senderId: friendRequestId, // The friend's ID who sent the request
            recipientId: userId // The current logged-in user's ID
          })
        }
      )

      const responseData = await response.json()
      console.log('API Response:', responseData)

      if (response.ok) {
        console.log('Friend request declined successfully')
        setRequests(prevRequests => prevRequests.filter(request => request._id !== friendRequestId))
        await fetchRequests()
      } else {
        console.log('Failed to decline friend request:', responseData.message)
      }
    } catch (error) {
      console.log('Error declining friend request:', error)
    }
  }

  return (
    <View style={styles.tabContent}>
      {requests.length > 0 ? (
        <ScrollView>
          {requests.map(request => (
            <View key={request._id} style={styles.cardContainer}>
              <View style={styles.profileContainer}>
                {request.profilePicture ? (
                  <Image source={{ uri: request.profilePicture }} style={styles.profilePicture} />
                ) : (
                  <View style={styles.profilePictureSmall} />
                )}
                <View style={styles.profileInfo}>
                  <Text style={styles.name}>{`${request.firstName} ${request.lastName}`}</Text>
                  <Text style={styles.role}>{request.role?.value}</Text>
                </View>
              </View>
              <View style={styles.optionButton}>
                <TouchableOpacity
                  onPress={() => acceptRequest(request._id, `${request.firstName} ${request.lastName}`)}
                  style={styles.acceptButton}
                >
                  <MaterialIcons name="check" size={22} color="#75F94C" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => declineRequest(request._id)} // Call declineRequest with the sender's ID
                  style={styles.declineButton}
                >
                  <MaterialIcons name="close" size={22} color="#EB3224" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.noFriendsContainer}>
          <Text style={styles.noFriendsText}>There is no friend request yet</Text>
        </View>
      )}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalText}>{friendName} is now your friend!</Text>
            <TouchableOpacity style={styles.modalButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const renderScene = SceneMap({
  connection: Connection,
  message: Message,
  request: Request
})

const Social = () => {
  const [index, setIndex] = useState(0)

  const [routes] = useState([
    { key: 'connection', title: 'Connection' },
    { key: 'message', title: 'Message' },
    { key: 'request', title: 'Request' }
  ])

  const renderTabBar = props => (
    <TabBar {...props} style={styles.tabBar} labelStyle={styles.tabLabel} indicatorStyle={styles.tabIndicator} />
  )

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
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  tabBar: {
    backgroundColor: '#045D91'
  },
  tabLabel: {
    color: 'white'
  },
  tabContent: {
    flex: 1
  },
  tabText: {
    fontSize: 18
  },
  tabIndicator: {
    backgroundColor: 'white',
    height: 2,
    borderRadius: 2 // Adjust the borderRadius as needed
  },
  searchBar: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    marginHorizontal: 10,
    marginTop: 10,
    marginBottom: 5,
    paddingLeft: 10
  },
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#DDDDDD',
    paddingVertical: 10,
    marginHorizontal: 20
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  profilePicture: {
    width: 65,
    height: 65,
    borderRadius: 50,
    backgroundColor: '#CCCCCC',
    marginRight: 15
  },
  viewProfilePicture: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#CCCCCC',
    marginRight: 15
  },
  profileInfo: {
    flexDirection: 'column'
  },
  name: {
    fontSize: 15,
    color: 'black'
  },
  role: {
    fontSize: 12,
    color: 'grey'
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4386AD',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 5,
    alignSelf: 'flex-start' // Ensure it doesn't grow beyond its content
  },
  buttonText: {
    fontSize: 12,
    color: 'white',
    marginLeft: 10
  },
  menuButton: {
    padding: 10
  },
  modalContainer: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 5,
    paddingHorizontal: 10
  },
  menuItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#DDDDDD'
  },
  menuOptions: {
    position: 'absolute',
    top: 20,
    right: 0,
    backgroundColor: 'white',
    zIndex: 1,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#DDD'
  },
  menuText: {
    fontSize: 12,
    paddingVertical: 5
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10
  },
  menuIcon: {
    paddingRight: 5
  },
  messageList: {
    flex: 1,
    marginBottom: 10
  },
  messageContainer: {
    marginVertical: 5,
    padding: 10,
    borderRadius: 10
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#daf8cb',
    padding: 10,
    borderRadius: 20
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f0f0',
    padding: 10,
    borderRadius: 20,
    marginVertical: 5
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
    paddingHorizontal: 10
  },
  sendButton: {
    marginLeft: 10,
    backgroundColor: '#007bff',
    borderRadius: 5,
    padding: 10
  },
  sendButtonText: {
    color: 'white'
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10
  },
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
    backgroundColor: '#CCCCCC' // Placeholder color for profile picture
  },
  profilePictureSmall: {
    width: 65,
    height: 65,
    borderRadius: 50,
    backgroundColor: '#CCCCCC' // Placeholder color for profile picture
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
  },
  modalMessageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4386AD',
    borderRadius: 10,
    paddingVertical: 10,
    marginTop: 5,
    width: 200,
    alignSelf: 'center'
  },
  acceptButton: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    borderWidth: 2,
    borderColor: '#75F94C',
    borderRadius: 25,
    width: 40,
    height: 40
  },
  declineButton: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    borderWidth: 2,
    borderColor: '#EB3224',
    borderRadius: 25,
    width: 40,
    height: 40
  },
  optionButton: {
    flexDirection: 'row',
    paddingTop: 8
  },
  modalBox: {
    minWidth: 'auto',
    backgroundColor: 'white',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10
  },
  modalButton: {
    backgroundColor: '#4386AD',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 7
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  },
  noFriendsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  noFriendsText: {
    fontSize: 16,
    color: '#666', // Subtle gray color
    textAlign: 'center'
  },
  addFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4386AD',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 10,
    marginTop: 5,
    alignSelf: 'flex-end' // Ensure it doesn't grow beyond its content
  },
  addFriendLink: {
    alignSelf: 'flex-end',
    marginLeft: 5,
    fontSize: 12,
    color: '#FFF' // Blue color to resemble a hyperlink
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    marginTop: 10
  },
  backButtonText: {
    fontSize: 16,
    marginLeft: 5,
    color: 'gray'
  },
  connectPageContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  connectPageText: {
    fontSize: 18,
    color: 'gray'
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4386AD',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 5,
    alignSelf: 'flex-start'
  },
  pendingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'gray', // Gray color to indicate a pending state
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 5,
    alignSelf: 'flex-start'
  },
  timestamp: {
    fontSize: 10,
    color: 'gray',
    marginTop: 5
  }
})

export default Social
