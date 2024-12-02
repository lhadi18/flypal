import axios from 'axios'

export const fetchAircraftTypes = async () => {
  try {
    const response = await axios.get(
      'https://7d17-2001-e68-5472-cb83-c4f6-c7c0-affd-aecd.ngrok-free.app/api/aircraft/getAircraft'
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
