import { useEffect, useState } from 'react'
import { FaFilm, FaClock, FaCalendar, FaSpinner, FaStar } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import Header from '../../components/Header'
import { movieService } from '../../services/movieService'

export default function MoviesPage() {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, now_showing, upcoming, coming_soon

  useEffect(() => {
    fetchMovies()
  }, [filter])

  const fetchMovies = async () => {
    try {
      setLoading(true)
      let response
      switch (filter) {
        case 'now_showing':
          response = await movieService.getNowShowingMovies()
          break
        case 'upcoming':
          response = await movieService.getUpcomingMovies()
          break
        default:
          response = await movieService.getAllMovies()
      }
      // Backend returns { data: { movies: [], meta: {} } }
      setMovies(response.data?.movies || [])
    } catch (error) {
      console.error('Failed to fetch movies:', error)
      setMovies([])
    } finally {
      setLoading(false)
    }
  }

  const filters = [
    { value: 'all', label: 'Tất cả phim' },
    { value: 'now_showing', label: 'Đang chiếu' },
    { value: 'upcoming', label: 'Sắp chiếu' },
  ]

  const formatDate = (dateString) => {
    if (!dateString) return 'TBA'
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-red-900/20 to-purple-900/20 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 flex items-center gap-3">
            <FaFilm className="text-red-500" />
            Phim Đang Chiếu
          </h1>
          <p className="text-gray-300 text-lg">
            Khám phá những bộ phim mới nhất và đặt vé ngay hôm nay
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-4 mb-8">
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                filter === f.value
                  ? 'bg-gradient-to-r from-red-600 to-red-800 text-white shadow-lg shadow-red-500/50'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <FaSpinner className="animate-spin text-red-500 text-5xl" />
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-20">
            <FaFilm className="mx-auto text-gray-600 text-6xl mb-4" />
            <p className="text-gray-400 text-xl">Không có phim nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {movies.map((movie) => (
              <Link
                key={movie.id}
                to={`/showtimes`}
                className="group bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden hover:shadow-2xl hover:shadow-red-500/30 transition-all duration-300 transform hover:-translate-y-2"
              >
                {/* Movie Poster */}
                <div className="relative h-96 overflow-hidden">
                  {movie.poster_url ? (
                    <img
                      src={movie.poster_url}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                      <FaFilm className="text-gray-600 text-6xl" />
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-2 left-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        movie.status === 'showing'
                          ? 'bg-green-500 text-white'
                          : movie.status === 'upcoming'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-500 text-white'
                      }`}
                    >
                      {movie.status === 'showing'
                        ? 'Đang chiếu'
                        : movie.status === 'upcoming'
                          ? 'Sắp chiếu'
                          : 'Đã kết thúc'}
                    </span>
                  </div>

                  {/* Rating Badge */}
                  {movie.rating && (
                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                      <FaStar className="text-yellow-400 text-sm" />
                      <span className="text-white text-sm font-bold">{movie.rating}</span>
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-gray-900 to-transparent" />
                </div>

                {/* Movie Info */}
                <div className="p-4">
                  <h3 className="text-white font-bold text-lg mb-2 line-clamp-2 group-hover:text-red-400 transition-colors">
                    {movie.title}
                  </h3>

                  <div className="space-y-2 text-sm">
                    {/* Genre */}
                    {movie.genre && (
                      <p className="text-gray-400">
                        <span className="text-red-400">Thể loại:</span> {movie.genre}
                      </p>
                    )}

                    {/* Duration */}
                    {movie.duration && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <FaClock className="text-red-400" />
                        <span>{formatDuration(movie.duration)}</span>
                      </div>
                    )}

                    {/* Release Date */}
                    {movie.release_date && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <FaCalendar className="text-red-400" />
                        <span>{formatDate(movie.release_date)}</span>
                      </div>
                    )}
                  </div>

                  {/* Director */}
                  {movie.director && (
                    <p className="text-gray-500 text-xs mt-3 line-clamp-1">
                      Đạo diễn: {movie.director}
                    </p>
                  )}
                </div>

                {/* Hover Action */}
                <div className="px-4 pb-4">
                  <div className="bg-gradient-to-r from-red-600 to-red-800 text-white text-center py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-medium">
                    Xem lịch chiếu
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}