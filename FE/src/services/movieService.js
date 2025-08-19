import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const movieApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token if available
movieApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Movie Service API calls
export const movieService = {
  // Get all movies (now showing)
  getAllMovies: async () => {
    try {
      const response = await movieApi.get('/v1/movies');
      return response.data;
    } catch (error) {
      console.error('Error fetching movies:', error);
      throw error;
    }
  },

  // Get now showing movies
  getNowShowingMovies: async () => {
    try {
      const response = await movieApi.get('/v1/movies?status=now_showing');
      return response.data;
    } catch (error) {
      console.error('Error fetching now showing movies:', error);
      throw error;
    }
  },

  // Get coming soon movies
  getComingSoonMovies: async () => {
    try {
      const response = await movieApi.get('/v1/movies?status=coming_soon');
      return response.data;
    } catch (error) {
      console.error('Error fetching coming soon movies:', error);
      throw error;
    }
  },

  // Get movie by ID
  getMovieById: async (id) => {
    try {
      const response = await movieApi.get(`/v1/movies/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching movie ${id}:`, error);
      throw error;
    }
  },

  // Get showtimes
  getShowtimes: async (movieId = null, roomId = null) => {
    try {
      let url = '/v1/showtimes';
      const params = new URLSearchParams();
      
      if (movieId) params.append('movie_id', movieId);
      if (roomId) params.append('room_id', roomId);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await movieApi.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching showtimes:', error);
      throw error;
    }
  },

  // Get upcoming showtimes
  getUpcomingShowtimes: async () => {
    try {
      const response = await movieApi.get('/v1/showtimes/upcoming');
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming showtimes:', error);
      throw error;
    }
  },

  // Get rooms
  getRooms: async () => {
    try {
      const response = await movieApi.get('/v1/rooms');
      return response.data;
    } catch (error) {
      console.error('Error fetching rooms:', error);
      throw error;
    }
  },

  // Get room seats
  getRoomSeats: async (roomId) => {
    try {
      const response = await movieApi.get(`/v1/rooms/${roomId}/seats`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching seats for room ${roomId}:`, error);
      throw error;
    }
  },

  // Get room showtimes
  getRoomShowtimes: async (roomId) => {
    try {
      const response = await movieApi.get(`/v1/rooms/${roomId}/showtimes`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching showtimes for room ${roomId}:`, error);
      throw error;
    }
  },

  // Search movies
  searchMovies: async (query) => {
    try {
      const response = await movieApi.get(`/v1/movies?search=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Error searching movies:', error);
      throw error;
    }
  },

  // Get movies by genre
  getMoviesByGenre: async (genre) => {
    try {
      const response = await movieApi.get(`/v1/movies?genre=${encodeURIComponent(genre)}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching movies by genre ${genre}:`, error);
      throw error;
    }
  }
};

// Export individual functions for backward compatibility
export const {
  getAllMovies,
  getNowShowingMovies,
  getComingSoonMovies,
  getMovieById,
  getShowtimes,
  getUpcomingShowtimes,
  getRooms,
  getRoomSeats,
  getRoomShowtimes,
  searchMovies,
  getMoviesByGenre
} = movieService;

export default movieService;