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

  getSeatsByShowtime: async (showtimeId) => {
    try {
      const response = await clientSeatApi.get(`/showtimes/${showtimeId}/seats`)
      return response.data
    } catch (error) {
      console.error('Error fetching showtime seats:', error)
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

  // Get seat type multipliers (matches backend pricing)
  getSeatTypeMultipliers: () => [
    { value: 'regular', label: 'Thường', multiplier: 1.0 },
    { value: 'vip', label: 'VIP', multiplier: 1.5 },
    { value: 'couple', label: 'Đôi', multiplier: 2.5 },
  ],

  // Calculate seat price based on base price and seat type
  calculateSeatPrice: (seatType, basePrice) => {
    const multipliers = clientSeatService.getSeatTypeMultipliers()
    const typeInfo = multipliers.find(t => t.value === seatType)
    const multiplier = typeInfo ? typeInfo.multiplier : 1.0
    return Math.round(basePrice * multiplier)
  },

  // Legacy function for backward compatibility (uses default base price)
  getSeatTypes: (basePrice = 50000) => [
    { value: 'regular', label: 'Thường', price: Math.round(basePrice * 1.0) },
    { value: 'vip', label: 'VIP', price: Math.round(basePrice * 1.5) },
    { value: 'couple', label: 'Đôi', price: Math.round(basePrice * 2.5) },
  ],

  getSeatStatuses: () => [
    { value: 'available', label: 'Có sẵn' },
    { value: 'occupied', label: 'Đã đặt' },
    { value: 'maintenance', label: 'Bảo trì' },
    { value: 'blocked', label: 'Bị khóa' },
  ],
}

export default clientSeatService
