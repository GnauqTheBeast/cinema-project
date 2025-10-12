import axios from 'axios'

const API_URL = process.env.REACT_APP_MOVIE_API_URL || 'http://localhost:8083/api/v1'

const bookingApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

bookingApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

export const bookingService = {
  // Get available seats for a showtime
  getAvailableSeats: async (showtimeId) => {
    try {
      const response = await bookingApi.get(`/showtimes/${showtimeId}/seats`)
      return response.data
    } catch (error) {
      console.error('Error fetching available seats:', error)
      throw error
    }
  },

  // Create a booking
  createBooking: async (bookingData) => {
    try {
      const response = await bookingApi.post('/bookings', bookingData)
      return response.data
    } catch (error) {
      console.error('Error creating booking:', error)
      throw error
    }
  },

  // Get user's bookings
  getUserBookings: async (page = 1, size = 10) => {
    try {
      const response = await bookingApi.get(`/bookings?page=${page}&size=${size}`)
      return response.data
    } catch (error) {
      console.error('Error fetching user bookings:', error)
      throw error
    }
  },

  // Get booking by ID
  getBookingById: async (id) => {
    try {
      const response = await bookingApi.get(`/bookings/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching booking:', error)
      throw error
    }
  },

  // Cancel booking
  cancelBooking: async (id) => {
    try {
      const response = await bookingApi.patch(`/bookings/${id}/cancel`)
      return response.data
    } catch (error) {
      console.error('Error canceling booking:', error)
      throw error
    }
  },

  // Get booking statuses
  getBookingStatuses: () => [
    { value: 'pending', label: 'Chờ thanh toán' },
    { value: 'confirmed', label: 'Đã xác nhận' },
    { value: 'cancelled', label: 'Đã hủy' },
    { value: 'completed', label: 'Hoàn thành' },
  ],
}

export default bookingService
