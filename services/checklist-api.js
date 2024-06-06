import axios from 'axios';

const API_URL = 'https://2778-183-171-133-92.ngrok-free.app'; // Replace with your ngrok URL

export const createChecklist = async checklistData => {
  try {
    const response = await axios({
        method: 'post',
        url: `${API_URL}/api/checklists`, 
        data: {
            ...checklistData
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
};
