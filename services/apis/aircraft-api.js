import axios from 'axios'

export const fetchAircraftTypes = async () => {
  try {
    const response = await axios.get(
      'https://74ae-2402-1980-24d-8201-85fb-800c-f2c4-1947.ngrok-free.app/api/aircraft/getAircraft'
    )
    const data = response.data
      .map(item => ({
        label: `${item.Model}`,
        value: item._id
      }))
      .sort((a, b) => a.label.localeCompare(b.label)) // sort by label (Model)
    return data
  } catch (error) {
    console.error(error)
  }
}
