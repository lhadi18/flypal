import axios from 'axios'

export const registerUser = async userData => {
  try {
    const response = await axios({
      method: 'post',
      url: `https://36b3-103-18-0-19.ngrok-free.app/api/users/register`,
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
      url: `https://36b3-103-18-0-19.ngrok-free.app/api/users/login`,
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
      url: `https://36b3-103-18-0-19.ngrok-free.app/api/users/validateUserId`,
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
