import axios from 'axios'

export const fetchAircraftTypes = async () => {
  try {
    const response = await axios.get(
      'https://7ce4-2001-e68-5472-cb83-3412-5ea7-c09e-97c5.ngrok-free.app/api/aircraft/getAircraft'
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
