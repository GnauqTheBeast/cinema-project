import { useEffect, useState } from 'react'
import {
  FaArrowRight,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaPlay,
  FaSpinner,
  FaStar,
  FaTicketAlt,
} from 'react-icons/fa'
import { Link } from 'react-router-dom'
import Header from '../../components/Header'
import { movieService } from '../../services/movieService'

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [nowShowingMovies, setNowShowingMovies] = useState([])
  const [comingSoonMovies, setComingSoonMovies] = useState([])
  const [heroMovies, setHeroMovies] = useState([])
  const [loading, setLoading] = useState({
    nowShowing: true,
    comingSoon: true,
    hero: true,
  })
  const [error, setError] = useState({
    nowShowing: null,
    comingSoon: null,
    hero: null,
  })

  // Fetch data from APIs
  const fetchMovieData = async () => {
    try {
      // Fetch all movies first
      const allMoviesResponse = await movieService.getAllMovies()
      const allMovies = allMoviesResponse.data?.movies || []

      // Filter movies by status
      const nowShowing = allMovies.filter((movie) => movie.status === 'showing')
      const upcoming = allMovies.filter((movie) => movie.status === 'upcoming')

      setNowShowingMovies(nowShowing)
      setLoading((prev) => ({ ...prev, nowShowing: false }))

      // Use first 3 now showing movies for hero section, fallback to any movies
      const heroData = nowShowing.length > 0 ? nowShowing.slice(0, 3) : allMovies.slice(0, 3)
      setHeroMovies(heroData)
      setLoading((prev) => ({ ...prev, hero: false }))

      setComingSoonMovies(upcoming)
      setLoading((prev) => ({ ...prev, comingSoon: false }))
    } catch (err) {
      console.error('Error fetching movies:', err)
      setError((prev) => ({
        ...prev,
        nowShowing: 'Không thể tải phim đang chiếu',
        hero: 'Không thể tải dữ liệu',
        comingSoon: 'Không thể tải phim sắp chiếu',
      }))
      setLoading((prev) => ({ nowShowing: false, hero: false, comingSoon: false }))
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchMovieData()
  }, [])

  // Auto slide for hero section
  useEffect(() => {
    if (heroMovies.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % heroMovies.length)
      }, 5000)
      return () => clearInterval(timer)
    }
  }, [heroMovies.length])

  // Helper function to format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-12">
      <FaSpinner className="animate-spin text-4xl text-red-600" />
    </div>
  )

  const ErrorMessage = ({ message }) => (
    <div className="text-center py-12">
      <p className="text-red-400 text-lg">{message}</p>
      <button
        onClick={fetchMovieData}
        className="mt-4 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors duration-300"
      >
        Thử lại
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-black">
      <Header />

      {/* Hero Section */}
      <section className="relative h-[70vh] overflow-hidden">
        {loading.hero ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <LoadingSpinner />
          </div>
        ) : error.hero ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <ErrorMessage message={error.hero} />
          </div>
        ) : heroMovies.length > 0 ? (
          heroMovies.map((movie, index) => {
            return (
              <div
                key={movie.id}
                className={`absolute inset-0 transition-transform duration-1000 ease-in-out ${
                  index === currentSlide ? 'translate-x-0' : 'translate-x-full'
                }`}
              >
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60"></div>
                <div className="absolute inset-0 flex items-center">
                  <div className="max-w-7xl mx-auto px-4 w-full">
                    <div className="max-w-2xl">
                      <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
                        {movie.title}
                      </h1>
                      <p className="text-xl text-gray-200 mb-6">{movie.description}</p>
                      <div className="flex items-center space-x-6 mb-8">
                        <div className="flex items-center space-x-2">
                          <FaStar className="text-yellow-400" />
                          <span className="text-white font-medium">{movie.rating || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FaClock className="text-gray-400" />
                          <span className="text-gray-300">
                            {movie.duration ? `${movie.duration} phút` : 'N/A'}
                          </span>
                        </div>
                        <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                          {movie.genre || 'Phim'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4">
                        <Link
                          to="/showtimes"
                          className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center space-x-2 transform hover:scale-105"
                        >
                          <FaTicketAlt />
                          <span>Đặt vé ngay</span>
                        </Link>
                        {movie.trailer_url && (
                          <a
                            href={movie.trailer_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-black px-8 py-3 rounded-lg font-semibold transition-all duration-300 flex items-center space-x-2"
                          >
                            <FaPlay />
                            <span>Xem trailer</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <p className="text-gray-400 text-xl">Không có phim nào để hiển thị</p>
          </div>
        )}

        {/* Slide indicators */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-3">
          {heroMovies.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'bg-red-600 w-8' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </section>

      {/* Now Showing Section */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold text-white">Phim đang chiếu</h2>
            <Link
              to="/movies"
              className="text-red-400 hover:text-red-300 font-medium flex items-center space-x-2 transition-colors duration-300"
            >
              <span>Xem tất cả</span>
              <FaArrowRight />
            </Link>
          </div>

          {loading.nowShowing ? (
            <LoadingSpinner />
          ) : error.nowShowing ? (
            <ErrorMessage message={error.nowShowing} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {nowShowingMovies.map((movie) => (
                <div
                  key={movie.id}
                  className="bg-black/50 rounded-xl overflow-hidden hover:transform hover:scale-105 transition-all duration-300 group"
                >
                  <div className="relative">
                    <img
                      src={movie.poster_url}
                      alt={movie.title}
                      className="w-full h-80 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      {movie.trailer_url ? (
                        <a
                          href={movie.trailer_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-full transform scale-75 group-hover:scale-100 transition-transform duration-300"
                        >
                          <FaPlay className="w-6 h-6" />
                        </a>
                      ) : (
                        <Link
                          to={`/movie/${movie.id}`}
                          className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-full transform scale-75 group-hover:scale-100 transition-transform duration-300"
                        >
                          <FaTicketAlt className="w-6 h-6" />
                        </Link>
                      )}
                    </div>
                    {movie.rating && (
                      <div className="absolute top-4 right-4 bg-black/80 text-white px-2 py-1 rounded-md text-sm flex items-center space-x-1">
                        <FaStar className="text-yellow-400 w-3 h-3" />
                        <span>{movie.rating}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-white mb-2 line-clamp-2">
                      {movie.title}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">{movie.genre || 'Phim'}</p>
                    <div className="space-y-2">
                      <p className="text-gray-300 text-sm font-medium">
                        Thời lượng: {movie.duration ? `${movie.duration} phút` : 'N/A'}
                      </p>
                      <Link
                        to={`/movie/${movie.id}`}
                        className="block w-full bg-red-600 hover:bg-red-700 text-white text-center py-2 rounded-md text-sm font-medium transition-colors duration-300"
                      >
                        Xem lịch chiếu
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="py-16 bg-black">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-bold text-white">Phim sắp chiếu</h2>
            <Link
              to="/coming-soon"
              className="text-red-400 hover:text-red-300 font-medium flex items-center space-x-2 transition-colors duration-300"
            >
              <span>Xem tất cả</span>
              <FaArrowRight />
            </Link>
          </div>

          {loading.comingSoon ? (
            <LoadingSpinner />
          ) : error.comingSoon ? (
            <ErrorMessage message={error.comingSoon} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {comingSoonMovies.map((movie) => (
                <div
                  key={movie.id}
                  className="bg-gray-900 rounded-xl overflow-hidden hover:transform hover:scale-105 transition-all duration-300 group"
                >
                  <div className="relative">
                    <img
                      src={movie.poster_url}
                      alt={movie.title}
                      className="w-full h-96 object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-2xl font-bold text-white mb-2">{movie.title}</h3>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-300 text-sm">{movie.genre || 'Phim'}</span>
                        <div className="flex items-center space-x-2 text-red-400">
                          <FaCalendarAlt className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            {movie.release_date ? formatDate(movie.release_date) : 'Sắp công bố'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Tại sao chọn HQ Cinema?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-red-800 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <FaTicketAlt className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Đặt vé dễ dàng</h3>
              <p className="text-gray-400">
                Đặt vé online nhanh chóng, tiện lợi với nhiều phương thức thanh toán
              </p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-red-800 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <FaMapMarkerAlt className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Hệ thống rạp rộng khắp</h3>
              <p className="text-gray-400">
                Hơn 100 rạp chiếu phim trên toàn quốc với trang thiết bị hiện đại
              </p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-red-600 to-red-800 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <FaStar className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Chất lượng cao cấp</h3>
              <p className="text-gray-400">
                Âm thanh Dolby Atmos, hình ảnh 4DX mang đến trải nghiệm điện ảnh tuyệt vời
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-red-800 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">HQ</span>
                </div>
                <span className="text-white font-bold text-lg">Cinema</span>
              </div>
              <p className="text-gray-400 text-sm">
                Hệ thống rạp chiếu phim hàng đầu Việt Nam, mang đến trải nghiệm điện ảnh tuyệt vời
                nhất.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Phim</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <Link to="#" className="hover:text-red-400 transition-colors duration-300">
                    Phim đang chiếu
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-red-400 transition-colors duration-300">
                    Phim sắp chiếu
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-red-400 transition-colors duration-300">
                    Suất chiếu đặc biệt
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Rạp HQ Cinema</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <Link to="#" className="hover:text-red-400 transition-colors duration-300">
                    Tất cả các rạp
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-red-400 transition-colors duration-300">
                    Rạp đặc biệt
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-red-400 transition-colors duration-300">
                    Sự kiện
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Hỗ trợ</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>
                  <Link to="#" className="hover:text-red-400 transition-colors duration-300">
                    Liên hệ
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-red-400 transition-colors duration-300">
                    Câu hỏi thường gặp
                  </Link>
                </li>
                <li>
                  <Link to="#" className="hover:text-red-400 transition-colors duration-300">
                    Chính sách
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">© 2025 HQ Cinema. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
