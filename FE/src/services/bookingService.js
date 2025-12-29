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

  createBooking: async (bookingData) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Token not found')
      }
      
      const response = await apiClient.post('/bookings', bookingData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error creating booking:', error)
      throw error
    }
  },

  getBookingById: async (bookingId) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Token not found')
      }

      const response = await apiClient.get(`/bookings/${bookingId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching booking:', error)
      throw error
    }
  },

  searchTickets: async (ticketId = '', showtimeId = '') => {
    try {
      const params = new URLSearchParams()

      if (ticketId) {
        params.append('ticket_id', ticketId)
      }
      if (showtimeId) {
        params.append('showtime_id', showtimeId)
      }

      const response = await apiClient.get(`/tickets/search?${params.toString()}`)
      return response.data
    } catch (error) {
      console.error('Error searching tickets:', error)
      throw error
    }
  },

  markTicketAsUsed: async (ticketId) => {
    try {
      const response = await apiClient.patch(`/tickets/${ticketId}/mark-used`)
      return response.data
    } catch (error) {
      console.error('Error marking ticket as used:', error)
      throw error
    }
  },
}