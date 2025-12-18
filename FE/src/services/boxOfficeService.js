import apiClient from './apiClient'

export const boxOfficeService = {
  createBoxOfficeBooking: async (bookingData) => {
    const adminToken = localStorage.getItem('adminToken')
    if (!adminToken) {
      throw new Error('Admin token not found')
    }

    const response = await apiClient.post('/bookings/box-office', bookingData, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    })
    return response.data
  },
}

export default boxOfficeService

