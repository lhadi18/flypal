// store.js
import { create } from 'zustand'

export const useGlobalStore = create(set => ({
  selectedAirport: null,
  setSelectedAirport: airport => set({ selectedAirport: airport }),

  diningData: {}, // An object to cache dining data for each airport by its ID
  setDiningData: (airportId, data) =>
    set(state => ({
      diningData: {
        ...state.diningData,
        [airportId]: data
      }
    })),

  eventData: {}, // An object to cache event data for each airport by its ID
  setEventData: (airportId, data) =>
    set(state => ({
      eventData: {
        ...state.eventData,
        [airportId]: data
      }
    }))
}))
