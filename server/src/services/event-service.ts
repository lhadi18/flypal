import dotenv from 'dotenv'

const axios = require('axios')

dotenv.config()

const API_KEY = process.env.SERP_API_KEY

export const fetchEvents = async (city: string, country: string) => {
  const query = `Events+in+${city}`
  console.log(API_KEY)
  try {
    const response = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: 'google_events',
        q: query,
        hl: 'en',
        gl: 'us',
        api_key: API_KEY
      }
    })

    const events = response.data.events_results
    return events
  } catch (error) {
    console.error('Error fetching events:', error)
    throw error
  }
}
