import axios from 'axios'

const API_URL = process.env.REACT_APP_USER_API_URL || 'http://localhost:8000/api/v1'

const userApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add request interceptor to include auth token if available
userApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// User Service API calls
export const userService = {
  // Get user by ID
  getUserById: async (id) => {
    try {
      const response = await userApi.get(`/users/${id}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error)
      throw error
    }
  },

  // Update user by ID
  updateUser: async (id, userData) => {
    try {
      const response = await userApi.put(`/users/${id}`, userData)
      return response.data
    } catch (error) {
      console.error(`Error updating user ${id}:`, error)
      throw error
    }
  },
}

// Export individual functions for backward compatibility
export const { getUserById, updateUser } = userService

export default userService
