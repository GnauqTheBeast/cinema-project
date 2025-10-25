import apiClient from './apiClient'

export const bookingService = {
  getUserBookings: async (page = 1, size = 10, status = '') => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
      })
      
      if (status) {
        params.append('status', status)
      }

      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Token not found')
      }
      const response = await apiClient.get(`/bookings/me?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching user bookings:', error)
      throw error
    }
  },
}