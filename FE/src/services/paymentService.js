import axios from 'axios'

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1'

const paymentApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

paymentApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

export const paymentService = {
  createPayment: async (bookingId, amount) => {
    try {
      const response = await paymentApi.post('/payments', {
        booking_id: bookingId,
        amount: amount,
      })
      return response.data
    } catch (error) {
      console.error('Error creating payment:', error)
      throw error
    }
  },

  getPaymentByBookingId: async (bookingId) => {
    try {
      const response = await paymentApi.get(`/payments/booking/${bookingId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching payment:', error)
      throw error
    }
  },

  generateQRCodeUrl: (bookingId, amount) => {
    const acc = '51020036688'
    const bank = 'MBBANK'
    const des = `QH-${bookingId}`
    return `https://qr.sepay.vn/img?acc=${acc}&bank=${bank}&amount=${Math.round(amount)}&des=${des}`
  },
}

export default paymentService
