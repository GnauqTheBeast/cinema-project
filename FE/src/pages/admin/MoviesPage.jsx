import { useCallback, useEffect, useState } from 'react'
import { FaExclamationTriangle, FaFilm, FaPlus, FaSearch, FaSpinner } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import MovieCard from '../../components/admin/MovieCard'
import { movieService } from '../../services/movieApi'

export default function MoviesPage() {
  const [movies, setMovies] = useState([])
  const [meta, setMeta] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const navigate = useNavigate()

  const fetchMovies = useCallback(async (page = 1, size = 12, search = '') => {
    try {
      setLoading(page === 1)
      if (search) setSearching(true)

      const data = await movieService.getMovies(page, size, search)
      setMovies(data.data?.movies || [])
      setMeta(data.data?.meta || {})
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load movies')
      console.error('Error fetching movies:', err)
    } finally {
      setLoading(false)
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    fetchMovies()
  }, [fetchMovies])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchMovies(1, 12, searchQuery)
  }

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchQuery(value)

    if (value === '') {
      fetchMovies(1, 12, '')
    }
  }

  const handlePageChange = (newPage) => {
    fetchMovies(newPage, meta.size, searchQuery)
    window.scrollTo(0, 0)
  }

  const clearSearch = () => {
    setSearchQuery('')
    fetchMovies(1, 12, '')
  }

  if (loading && !searching) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <FaSpinner className="animate-spin text-4xl text-red-600 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">Đang tải danh sách phim...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <FaFilm className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Quản lý phim</h1>
                <p className="text-gray-600">Quản lý danh sách phim trong hệ thống rạp</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/admin/movies/new')}
              className="flex items-center space-x-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <FaPlus size={16} />
              <span>Thêm phim mới</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Tìm kiếm phim theo tên..."
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={searching}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {searching ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>Đang tìm...</span>
                </>
              ) : (
                <>
                  <FaSearch />
                  <span>Tìm kiếm</span>
                </>
              )}
            </button>
          </form>

          {searchQuery && (
            <div className="mt-3 text-sm text-gray-600">
              {searching ? (
                <div className="flex items-center space-x-2">
                  <FaSpinner className="animate-spin" />
                  <span>Đang tìm kiếm...</span>
                </div>
              ) : (
                <span>
                  Kết quả tìm kiếm cho "<strong className="text-gray-800">{searchQuery}</strong>"
                  {meta.total !== undefined && ` (${meta.total} phim được tìm thấy)`}
                </span>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-gradient-to-r from-red-50 to-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FaExclamationTriangle className="h-5 w-5 text-red-500 mt-0.5" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Lỗi tải dữ liệu</h3>
                <div className="mt-1 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Movies Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {movies.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaFilm className="text-gray-400 text-2xl" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'Không tìm thấy phim nào' : 'Chưa có phim nào'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery
                  ? `Không có phim nào khớp với từ khóa "${searchQuery}"`
                  : 'Hãy thêm phim đầu tiên vào hệ thống'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => navigate('/admin/movies/new')}
                  className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  <FaPlus />
                  <span>Thêm phim đầu tiên</span>
                </button>
              )}
            </div>
          ) : (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {movies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {meta.total_pages > 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-600">
                Trang {meta.page} / {meta.total_pages} • Tổng {meta.total} phim
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(meta.page - 1)}
                  disabled={meta.page <= 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  ← Trước
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, meta.total_pages) }, (_, i) => {
                    const pageNum = Math.max(1, meta.page - 2) + i
                    if (pageNum > meta.total_pages) return null

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                          meta.page === pageNum
                            ? 'bg-red-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(meta.page + 1)}
                  disabled={meta.page >= meta.total_pages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  Sau →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
