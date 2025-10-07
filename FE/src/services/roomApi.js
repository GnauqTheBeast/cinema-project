import axios from 'axios'

const API_URL = process.env.REACT_APP_MOVIE_API_URL || 'http://localhost:8083/api/v1'

const roomApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

roomApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

export const roomService = {
  getRooms: async (page = 1, size = 10, search = '', roomType = '', status = '') => {
    let url = `/rooms?page=${page}&size=${size}`
    if (search) {
      url += `&search=${encodeURIComponent(search)}`
    }
    if (roomType) {
      url += `&room_type=${roomType}`
    }
    if (status) {
      url += `&status=${status}`
    }
    const response = await roomApi.get(url)
    return response.data
  },

  getRoomById: async (id) => {
    const response = await roomApi.get(`/rooms/${id}`)
    return response.data
  },

  createRoom: async (roomData) => {
    const response = await roomApi.post('/rooms', roomData)
    return response.data
  },

  updateRoom: async (id, roomData) => {
    const response = await roomApi.put(`/rooms/${id}`, roomData)
    return response.data
  },

  deleteRoom: async (id) => {
    const response = await roomApi.delete(`/rooms/${id}`)
    return response.data
  },

  updateRoomStatus: async (id, status) => {
    const response = await roomApi.patch(`/rooms/${id}/status`, { status })
    return response.data
  },

  // Room types and statuses for form options
  getRoomTypes: () => [
    { value: 'standard', label: 'Standard' },
    { value: 'vip', label: 'VIP' },
    { value: 'imax', label: 'IMAX' },
    { value: '4dx', label: '4DX' },
  ],

  getRoomStatuses: () => [
    { value: 'active', label: 'Hoạt động' },
    { value: 'inactive', label: 'Không hoạt động' },
    { value: 'maintenance', label: 'Bảo trì' },
  ],
}

export default roomService
