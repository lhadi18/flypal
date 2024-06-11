import {
  StyleSheet,
  Text,
  View,
  Image,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated
} from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import React, { useState, useEffect, useRef } from 'react'
import { useGlobalStore } from '../../store/store'
import axios from 'axios'

const Weather = () => {
  const selectedAirport = useGlobalStore(state => state.selectedAirport)
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedForecast, setSelectedForecast] = useState(null)
  const [unit, setUnit] = useState('C')
  const [metarData, setMetarData] = useState(null)
  const [tafData, setTafData] = useState(null)
  const fadeAnim = useRef(new Animated.Value(0)).current

  const bearerToken = 'AKo0INMqEnakazJmK2ONyssjiFH8FomSaWgrQdmcEN4'

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const response = await axios.get('http://api.weatherapi.com/v1/forecast.json', {
          params: {
            key: '3771168436784bab93922931240606',
            q: `${selectedAirport.city},${selectedAirport.country}`,
            days: 3
          }
        })

        const data = response.data

        const weatherData = {
          current: data.current,
          forecast: data.forecast.forecastday
        }

        setWeather(weatherData)
        setLoading(false)
      } catch (err) {
        setError(err)
        setLoading(false)
      }
    }

    const fetchMetarTaf = async () => {
      try {
        const metarResponse = await axios.get(
          `https://avwx.rest/api/metar/${selectedAirport.ICAO}?options=&airport=true&reporting=true&format=json&remove=&filter=&onfail=cache`,
          {
            headers: {
              Authorization: `Bearer ${bearerToken}`
            }
          }
        )

        const tafResponse = await axios.get(
          `https://avwx.rest/api/taf/${selectedAirport.ICAO}?options=summary&airport=true&reporting=true&format=json&remove=&filter=&onfail=cache`,
          {
            headers: {
              Authorization: `Bearer ${bearerToken}`
            }
          }
        )

        setMetarData(metarResponse.data)
        setTafData(tafResponse.data)
      } catch (err) {
        setError(err)
      }
    }

    fetchWeather()
    fetchMetarTaf()
  }, [selectedAirport])

  const showDetails = details => {
    setSelectedForecast(details)
    setModalVisible(true)
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true
    }).start()
  }

  const hideDetails = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true
    }).start(() => {
      setModalVisible(false)
    })
  }

  const toggleUnit = selectedUnit => {
    setUnit(selectedUnit)
  }

  const convertTemp = (temp, toUnit) => {
    return toUnit === 'C' ? Math.round(temp) : Math.round((temp * 9) / 5 + 32)
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4386AD" />
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load weather data. Please try again later.</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.cityCountry}>
            {selectedAirport.city}, {selectedAirport.country}
          </Text>
        </View>
        <Image source={{ uri: `https:${weather.current.condition.icon}` }} style={styles.weatherIcon} />
        <View style={styles.temperatureContainer}>
          <Text style={styles.temperature}>
            {unit === 'C' ? `${weather.current.temp_c}°C` : `${convertTemp(weather.current.temp_c, 'F')}°F`}
          </Text>
          <View style={styles.unitSelector}>
            <TouchableOpacity onPress={() => toggleUnit('F')}>
              <Text style={[styles.unit, unit === 'F' && styles.selectedUnit]}>F</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => toggleUnit('C')}>
              <Text style={[styles.unit, unit === 'C' && styles.selectedUnit]}>C</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.condition}>{weather.current.condition.text}</Text>
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Icon name="weather-windy" size={24} color="#4386AD" />
            <Text style={styles.detailTitle}>Wind</Text>
            <Text style={styles.detailValue}>{weather.current.wind_kph} km/h</Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="water-percent" size={24} color="#4386AD" />
            <Text style={styles.detailTitle}>Humidity</Text>
            <Text style={styles.detailValue}>{weather.current.humidity}%</Text>
          </View>
          <View style={styles.detailItem}>
            <Icon name="weather-sunny-alert" size={24} color="#4386AD" />
            <Text style={styles.detailTitle}>UV Index</Text>
            <Text style={styles.detailValue}>{weather.current.uv}</Text>
          </View>
        </View>
        <View style={styles.forecastContainer}>
          {weather.forecast &&
            weather.forecast.map((day, index) => (
              <TouchableOpacity key={index} style={styles.forecastItem} onPress={() => showDetails(day)}>
                <Text style={styles.forecastDay}>
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </Text>
                <Image source={{ uri: `https:${day.day.condition.icon}` }} style={styles.forecastIcon} />
                <Text style={styles.forecastTempMax}>
                  {unit === 'C' ? `${day.day.maxtemp_c}°C` : `${convertTemp(day.day.maxtemp_c, 'F')}°F`}
                </Text>
                <Text style={styles.forecastTempMin}>
                  {unit === 'C' ? `${day.day.mintemp_c}°C` : `${convertTemp(day.day.mintemp_c, 'F')}°F`}
                </Text>
              </TouchableOpacity>
            ))}
        </View>

        {/* METAR and TAF Section */}
        <View style={styles.metarTafContainer}>
          <Text style={styles.sectionTitle}>METAR Information</Text>
          <Text style={styles.metarTafText}>{metarData ? metarData.sanitized : 'Loading...'}</Text>
          <Text style={styles.sectionTitle}>TAF Information</Text>
          <Text style={styles.metarTafText}>{tafData ? tafData.sanitized : 'Loading...'}</Text>
        </View>
      </ScrollView>
      {selectedForecast && (
        <Modal transparent={true} visible={modalVisible} onRequestClose={hideDetails}>
          <Animated.View style={[styles.modalContainer, { opacity: fadeAnim }]}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Weather Details</Text>
              <View style={styles.modalDetailRow}>
                <Icon name="thermometer-high" size={24} color="#4386AD" />
                <Text style={styles.modalDetailText}>
                  Max Temp:{' '}
                  {unit === 'C'
                    ? `${selectedForecast.day.maxtemp_c}°C`
                    : `${convertTemp(selectedForecast.day.maxtemp_c, 'F')}°F`}
                </Text>
              </View>
              <View style={styles.modalDetailRow}>
                <Icon name="thermometer-low" size={24} color="#4386AD" />
                <Text style={styles.modalDetailText}>
                  Min Temp:{' '}
                  {unit === 'C'
                    ? `${selectedForecast.day.mintemp_c}°C`
                    : `${convertTemp(selectedForecast.day.mintemp_c, 'F')}°F`}
                </Text>
              </View>
              <View style={styles.modalDetailRow}>
                <Icon name="weather-partly-cloudy" size={24} color="#4386AD" />
                <Text style={styles.modalDetailText}>Condition: {selectedForecast.day.condition.text}</Text>
              </View>
              <View style={styles.modalDetailRow}>
                <Icon name="weather-windy" size={24} color="#4386AD" />
                <Text style={styles.modalDetailText}>Wind Speed: {selectedForecast.day.maxwind_kph} km/h</Text>
              </View>
              <View style={styles.modalDetailRow}>
                <Icon name="water-percent" size={24} color="#4386AD" />
                <Text style={styles.modalDetailText}>Humidity: {selectedForecast.day.avghumidity}%</Text>
              </View>
              <View style={styles.modalDetailRow}>
                <Icon name="weather-sunny-alert" size={24} color="#4386AD" />
                <Text style={styles.modalDetailText}>UV Index: {selectedForecast.day.uv}</Text>
              </View>
              <TouchableOpacity onPress={hideDetails} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Modal>
      )}
    </SafeAreaView>
  )
}

export default Weather

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF' // white background
  },
  scrollContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EFFAFF' // light blue background
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFD700' // gold background for error
  },
  header: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20
  },
  cityCountry: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333' // dark text
  },
  weatherIcon: {
    width: 100,
    height: 100,
    marginBottom: 10
  },
  temperatureContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  temperature: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10
  },
  unitSelector: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  unit: {
    fontSize: 20,
    color: '#666',
    padding: 5
  },
  selectedUnit: {
    color: '#333',
    fontWeight: 'bold'
  },
  condition: {
    fontSize: 20,
    color: '#666',
    marginBottom: 20
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%'
  },
  detailItem: {
    alignItems: 'center'
  },
  detailTitle: {
    fontSize: 16,
    color: '#666'
  },
  detailValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  forecastContainer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%'
  },
  forecastItem: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4386AD',
    padding: 10,
    borderRadius: 5,
    margin: 5,
    width: 100,
    backgroundColor: '#EFFAFF' // light blue background for forecast items
  },
  forecastDay: {
    fontSize: 16,
    color: '#333'
  },
  forecastIcon: {
    width: 50,
    height: 50,
    marginVertical: 5
  },
  forecastTempMax: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  forecastTempMin: {
    fontSize: 14,
    color: '#666'
  },
  metarTafContainer: {
    marginTop: 20,
    padding: 10,
    width: '100%',
    backgroundColor: '#EFFAFF', // light blue background for METAR/TAF container
    borderWidth: 1,
    borderColor: '#4386AD', // blue border
    borderRadius: 5
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    color: '#333'
  },
  metarTafText: {
    fontSize: 16,
    color: '#555'
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginTop: 20
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    width: 300,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10
  },
  modalDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5
  },
  modalDetailText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333'
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#4386AD', // blue background
    borderRadius: 5
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16
  }
})
