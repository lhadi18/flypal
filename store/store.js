// store.js
import { create } from 'zustand'

export const useGlobalStore = create(set => ({
  selectedAirport: null,
  setSelectedAirport: airport => set({ selectedAirport: airport })
}))
