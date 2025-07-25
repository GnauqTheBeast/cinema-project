import axios from 'axios';

const API_URL = process.env.REACT_APP_MOVIE_API_URL || 'http://localhost:8083/api/v1';

const showtimeApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

showtimeApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const showtimeService = {
  getShowtimes: async (page = 1, size = 10, search = '', movieId = '', roomId = '', format = '', status = '', dateFrom = '', dateTo = '') => {
    let url = `/showtimes?page=${page}&size=${size}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    if (movieId) {
      url += `&movie_id=${movieId}`;
    }
    if (roomId) {
      url += `&room_id=${roomId}`;
    }
    if (format) {
      url += `&format=${format}`;
    }
    if (status) {
      url += `&status=${status}`;
    }
    if (dateFrom) {
      url += `&date_from=${dateFrom}`;
    }
    if (dateTo) {
      url += `&date_to=${dateTo}`;
    }
    const response = await showtimeApi.get(url);
    return response.data;
  },

  getShowtimeById: async (id) => {
    const response = await showtimeApi.get(`/showtimes/${id}`);
    return response.data;
  },

  getShowtimesByMovie: async (movieId) => {
    const response = await showtimeApi.get(`/movies/${movieId}/showtimes`);
    return response.data;
  },

  getShowtimesByRoom: async (roomId, date = '') => {
    let url = `/rooms/${roomId}/showtimes`;
    if (date) {
      url += `?date=${date}`;
    }
    const response = await showtimeApi.get(url);
    return response.data;
  },

  getUpcomingShowtimes: async (limit = 10) => {
    const response = await showtimeApi.get(`/showtimes/upcoming?limit=${limit}`);
    return response.data;
  },

  createShowtime: async (showtimeData) => {
    const response = await showtimeApi.post('/showtimes', showtimeData);
    return response.data;
  },

  updateShowtime: async (id, showtimeData) => {
    const response = await showtimeApi.put(`/showtimes/${id}`, showtimeData);
    return response.data;
  },

  deleteShowtime: async (id) => {
    const response = await showtimeApi.delete(`/showtimes/${id}`);
    return response.data;
  },

  updateShowtimeStatus: async (id, status) => {
    const response = await showtimeApi.patch(`/showtimes/${id}/status`, { status });
    return response.data;
  },

  checkTimeConflict: async (roomId, startTime, endTime, excludeId = '') => {
    let url = `/showtimes/conflict-check?room_id=${roomId}&start_time=${startTime}&end_time=${endTime}`;
    if (excludeId) {
      url += `&exclude_id=${excludeId}`;
    }
    const response = await showtimeApi.get(url);
    return response.data;
  },

  // Helper functions for time management
  truncateToHalfHour: (dateTime) => {
    const date = new Date(dateTime);
    const minutes = date.getMinutes();
    if (minutes < 30) {
      date.setMinutes(0, 0, 0);
    } else {
      date.setMinutes(30, 0, 0);
    }
    return date;
  },

  formatDateTime: (dateTime) => {
    return new Date(dateTime).toISOString();
  },

  // Showtime formats and statuses for form options
  getShowtimeFormats: () => [
    { value: '2d', label: '2D' },
    { value: '3d', label: '3D' },
    { value: 'imax', label: 'IMAX' },
    { value: '4dx', label: '4DX' }
  ],

  getShowtimeStatuses: () => [
    { value: 'scheduled', label: 'Đã lên lịch' },
    { value: 'ongoing', label: 'Đang chiếu' },
    { value: 'completed', label: 'Hoàn thành' },
    { value: 'canceled', label: 'Đã hủy' }
  ]
};

export default showtimeService; 