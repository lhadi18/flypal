import axios from 'axios'

export const fetchAircraftTypes = async () => {
  try {
    const response = await axios.get(
      'https://f002-2001-4458-c00f-951c-4c78-3e22-9ba3-a6ad.ngrok-free.app/api/aircraft/getAircraft'
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
