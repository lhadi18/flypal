import axios from 'axios'

export const fetchAircraftTypes = async () => {
  try {
    const response = await axios.get(
      'https://7e9e-103-18-0-19.ngrok-free.app/api/aircraft/getAircraft'
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
