import axios from 'axios'

const API_URL = process.env.REACT_APP_MOVIE_API_URL || 'http://localhost:8000/api/v1'

const showtimeApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

showtimeApi.interceptors.request.use(
  (config) => {
    const isAdminPage = window.location.pathname.startsWith('/admin')
    const authToken = isAdminPage
      ? localStorage.getItem('adminToken')
      : localStorage.getItem('token')

    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

export const showtimeService = {
  getShowtimes: async (
    page = 1,
    size = 10,
    search = '',
    movieId = '',
    roomId = '',
    format = '',
    status = '',
    dateFrom = '',
    dateTo = '',
  ) => {
    let url = `/showtimes?page=${page}&size=${size}`
    if (search) {
      url += `&search=${encodeURIComponent(search)}`
    }
    if (movieId) {
      url += `&movie_id=${movieId}`
    }
    if (roomId) {
      url += `&room_id=${roomId}`
    }
    if (format) {
      url += `&format=${format}`
    }
    if (status) {
      url += `&status=${status}`
    }
    if (dateFrom) {
      url += `&date_from=${dateFrom}`
    }
    if (dateTo) {
      url += `&date_to=${dateTo}`
    }
    const response = await showtimeApi.get(url)
    return response.data
  },

  getShowtimeById: async (id) => {
    const response = await showtimeApi.get(`/showtimes/${id}`)
    return response.data
  },

  getShowtimesByMovie: async (movieId) => {
    const response = await showtimeApi.get(`/showtimes?movie_id=${movieId}`)
    return response.data
  },

  getShowtimesByRoom: async (roomId, date = '') => {
    let url = `/rooms/${roomId}/showtimes`
    if (date) {
      url += `?date=${date}`
    }
    const response = await showtimeApi.get(url)
    return response.data
  },

  getUpcomingShowtimes: async (limit = 10) => {
    const response = await showtimeApi.get(`/showtimes/upcoming?limit=${limit}`)
    return response.data
  },

  createShowtime: async (showtimeData) => {
    const response = await showtimeApi.post('/showtimes', showtimeData)
    return response.data
  },

  updateShowtime: async (id, showtimeData) => {
    const response = await showtimeApi.put(`/showtimes/${id}`, showtimeData)
    return response.data
  },

  deleteShowtime: async (id) => {
    const response = await showtimeApi.delete(`/showtimes/${id}`)
    return response.data
  },

  updateShowtimeStatus: async (id, status) => {
    const response = await showtimeApi.patch(`/showtimes/${id}/status`, { status })
    return response.data
  },

  checkTimeConflict: async (roomId, startTime, endTime, excludeId = '') => {
    let url = `/showtimes/conflict-check?room_id=${roomId}&start_time=${startTime}&end_time=${endTime}`
    if (excludeId) {
      url += `&exclude_id=${excludeId}`
    }
    const response = await showtimeApi.get(url)
    return response.data
  },

  getShowtimeFormats: () => [
    { value: '2D', label: '2D' },
    { value: '3D', label: '3D' },
    { value: 'IMAX', label: 'IMAX' },
    { value: '4DX', label: '4DX' },
  ],

  getShowtimeStatuses: () => [
    { value: 'SCHEDULED', label: 'Đã lên lịch' },
    { value: 'ONGOING', label: 'Đang chiếu' },
    { value: 'COMPLETED', label: 'Hoàn thành' },
    { value: 'CANCELED', label: 'Đã hủy' },
  ],
}

export default showtimeService
