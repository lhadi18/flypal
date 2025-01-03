import axios from 'axios'

export const fetchAircraftTypes = async () => {
  try {
    const response = await axios.get('http://47.128.181.39:8080/api/aircraft/getAircraft')
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
