import React from 'react'
import { StyleSheet, Text, View, ImageBackground, Image, TouchableOpacity } from 'react-native'

const LandingPage = () => {
  return (
    <ImageBackground
      source={{
        uri: 'https://images.pexels.com/photos/314726/pexels-photo-314726.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
      }}
      style={styles.background}
    >
      <View style={styles.container}>
        <Image
          source={{ uri: 'https://content.imageresizer.com/images/memes/War-Cat-meme-88f6yf.jpg' }}
          style={styles.logo}
        />
        <Text style={styles.welcomeText}>FlyPal</Text>
        <TouchableOpacity style={styles.loginButton}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.registerButton}>
          <Text style={styles.registerButtonText}>Register</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  container: {
    alignItems: 'center'
  },
  logo: {
    width: 255,
    height: 265,
    marginBottom: 20
  },
  welcomeText: {
    fontSize: 32,
    fontFamily: 'Roboto',
    color: 'black',
    marginBottom: 40,
    fontWeight: '600'
  },
  loginButton: {
    width: 250,
    backgroundColor: '#045D91',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 200
  },
  loginButtonText: {
    color: 'white',
    fontFamily: 'Roboto',
    fontSize: 16,
    textAlign: 'center'
  },
  registerButton: {
    width: 250,
    backgroundColor: 'white',
    borderColor: '#045D91',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center'
  },
  registerButtonText: {
    color: '#045D91',
    fontFamily: 'Roboto',
    fontSize: 16,
    textAlign: 'center'
  }
})

export default LandingPage
