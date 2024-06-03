import axios from 'axios'

const API_URL = 'https://5b67-103-18-0-19.ngrok-free.app'

export const registerUser = async userData => {
  try {
    const response = await axios({
      method: 'post',
      url: `${API_URL}/api/users/register`,
      data: {
        ...userData
      }
    })
    console.log(response.data)
    return response.data
  } catch (error) {
    if (error.response && error.response.data) {
      throw error.response.data
    } else {
      throw new Error('An unknown error occurred')
    }
  }
}

export const loginUser = async userData => {
  try {
    const response = await axios({
      method: 'post',
      url: `${API_URL}/api/users/login`,
      data: {
        ...userData
      }
    })
    console.log(response.data)
    return response.data
  } catch (error) {
    if (error.response && error.response.data) {
      throw error.response.data
    } else {
      throw new Error('An unknown error occurred')
    }
  }
}

export const validateUserId = async userId => {
  try {
    const response = await axios({
      method: 'post',
      url: `${API_URL}/api/users/validateUserId`,
      data: {
        userId: userId
      }
    })
    console.log(4)
    console.log(response.data)
    return response.data
  } catch (error) {
    if (error.response && error.response.data) {
      throw error.response.data
    } else {
      throw new Error('An unknown error occurred')
    }
  }
}
