import apiClient from './apiClient'

export const bookingService = {
  getUserBookings: async (userId, page = 1, size = 10, status = '') => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
      })
      
      if (status) {
        params.append('status', status)
      }

      const response = await apiClient.get(`/api/v1/bookings/${userId}?${params.toString()}`)
      return response.data
    } catch (error) {
      console.error('Error fetching user bookings:', error)
      throw error
    }
  },

  getRecentBookings: async (userId, limit = 3) => {
    try {
      const response = await bookingService.getUserBookings(userId, 1, limit)
      return response
    } catch (error) {
      console.error('Error fetching recent bookings:', error)
      throw error
    }
  }
}