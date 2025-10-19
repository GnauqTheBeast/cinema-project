import axios from 'axios'

const API_URL = process.env.REACT_APP_MOVIE_API_URL || 'http://localhost:8000/api'

const clientSeatApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

clientSeatApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

export const clientSeatService = {
  getSeatsByRoom: async (roomId) => {
    try {
      const response = await clientSeatApi.get(`/rooms/${roomId}/seats`)
      return response.data
    } catch (error) {
      console.error('Error fetching room seats:', error)
      throw error
    }
  },

  getAvailableSeatsForShowtime: async (showtimeId) => {
    try {
      const response = await clientSeatApi.get(`/showtimes/${showtimeId}/seats`)
      return response.data
    } catch (error) {
      console.error('Error fetching available seats:', error)
      throw error
    }
  },

  getSeatTypes: () => [
    { value: 'regular', label: 'Thường', price: 50000 },
    { value: 'vip', label: 'VIP', price: 80000 },
    { value: 'couple', label: 'Đôi', price: 100000 },
    { value: '4dx', label: '4DX', price: 120000 },
  ],

  getSeatStatuses: () => [
    { value: 'available', label: 'Có sẵn' },
    { value: 'occupied', label: 'Đã đặt' },
    { value: 'maintenance', label: 'Bảo trì' },
    { value: 'blocked', label: 'Bị khóa' },
  ],
}

export default clientSeatService
