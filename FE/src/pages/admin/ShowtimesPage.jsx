import { useEffect, useState } from 'react'
import { FaCalendarAlt, FaClock, FaEdit, FaEye, FaPlus, FaSearch, FaTrash } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { movieService } from '../../services/movieApi'
import { roomService } from '../../services/roomApi'
import { showtimeService } from '../../services/showtimeApi'

const ShowtimesPage = () => {
  const [showtimes, setShowtimes] = useState([])
  const [rooms, setRooms] = useState([])
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedRoom, setSelectedRoom] = useState('')
  const [selectedMovie, setSelectedMovie] = useState('')
  const [selectedFormat, setSelectedFormat] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const showtimeFormats = showtimeService.getShowtimeFormats()
  const showtimeStatuses = showtimeService.getShowtimeStatuses()

  const fetchShowtimes = async () => {
    try {
      setLoading(true)
      const response = await showtimeService.getShowtimes(
        currentPage,
        10,
        search,
        selectedMovie,
        selectedRoom,
        selectedFormat,
        selectedStatus,
        dateFrom,
        dateTo,
      )

      if (response.success) {
        setShowtimes(response.data.data || [])
        setTotalPages(response.data.paging?.total_pages || 1)
      } else {
        setError('Không thể tải danh sách lịch chiếu')
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi tải dữ liệu')
      console.error('Error fetching showtimes:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchRooms = async () => {
    try {
      const response = await roomService.getRooms(1, 100)
      if (response.success) {
        setRooms(response.data.data || [])
      }
    } catch (err) {
      console.error('Error fetching rooms:', err)
    }
  }

  const fetchMovies = async () => {
    try {
      const response = await movieService.getMovies(1, 100)
      if (response.success) {
        setMovies(response.data.movies || [])
      }
    } catch (err) {
      console.error('Error fetching movies:', err)
    }
  }

  useEffect(() => {
    fetchRooms()
    fetchMovies()
  }, [])

  useEffect(() => {
    fetchShowtimes()
  }, [
    currentPage,
    search,
    selectedMovie,
    selectedRoom,
    selectedFormat,
    selectedStatus,
    dateFrom,
    dateTo,
  ])

  const handleSearch = (e) => {
    setSearch(e.target.value)
    setCurrentPage(1)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa lịch chiếu này?')) {
      return
    }

    try {
      await showtimeService.deleteShowtime(id)
      fetchShowtimes()
    } catch (err) {
      alert('Có lỗi xảy ra khi xóa lịch chiếu')
      console.error('Error deleting showtime:', err)
    }
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      await showtimeService.updateShowtimeStatus(id, newStatus)
      fetchShowtimes()
    } catch (err) {
      alert('Có lỗi xảy ra khi cập nhật trạng thái')
      console.error('Error updating status:', err)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'ongoing':
        return 'bg-green-100 text-green-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'canceled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getFormatLabel = (format) => {
    const formatObj = showtimeFormats.find((f) => f.value === format)
    return formatObj ? formatObj.label : format
  }

  const getRoomName = (roomId) => {
    const room = rooms.find((r) => r.id === roomId)
    return room ? `Phòng ${room.room_number}` : roomId
  }

  const getMovieName = (movieId) => {
    const movie = movies.find((m) => m.id === movieId)
    return movie ? movie.title : movieId
  }

  const formatDateTime = (dateTimeStr) => {
    const date = new Date(dateTimeStr)
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isUpcoming = (showtime) => {
    const now = new Date()
    const startTime = new Date(showtime.start_time)
    return startTime > now && showtime.status === 'scheduled'
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Lịch chiếu</h1>
            <p className="text-gray-600">Quản lý lịch chiếu phim với tính năng làm tròn 30 phút</p>
          </div>
          <Link
            to="/admin/showtimes/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <FaPlus />
            Thêm lịch chiếu mới
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm lịch chiếu..."
                value={search}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={selectedMovie}
              onChange={(e) => {
                setSelectedMovie(e.target.value)
                setCurrentPage(1)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả phim</option>
              {movies.map((movie) => (
                <option key={movie.id} value={movie.id}>
                  {movie.title}
                </option>
              ))}
            </select>

            <select
              value={selectedRoom}
              onChange={(e) => {
                setSelectedRoom(e.target.value)
                setCurrentPage(1)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả phòng</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  Phòng {room.room_number}
                </option>
              ))}
            </select>

            <select
              value={selectedFormat}
              onChange={(e) => {
                setSelectedFormat(e.target.value)
                setCurrentPage(1)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả định dạng</option>
              {showtimeFormats.map((format) => (
                <option key={format.value} value={format.value}>
                  {format.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value)
                setCurrentPage(1)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả trạng thái</option>
              {showtimeStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>

            <div className="relative">
              <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Từ ngày"
              />
            </div>

            <div className="relative">
              <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Đến ngày"
              />
            </div>

            <button
              onClick={() => {
                setSearch('')
                setSelectedMovie('')
                setSelectedRoom('')
                setSelectedFormat('')
                setSelectedStatus('')
                setDateFrom('')
                setDateTo('')
                setCurrentPage(1)
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : (
          <>
            {/* Showtimes Table */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phim
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phòng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thời gian
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Định dạng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giá vé
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {showtimes.map((showtime) => (
                    <tr
                      key={showtime.id}
                      className={`hover:bg-gray-50 ${isUpcoming(showtime) ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {getMovieName(showtime.movie_id)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{getRoomName(showtime.room_id)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center gap-1">
                            <FaClock className="text-gray-400" />
                            {formatDateTime(showtime.start_time)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Kết thúc: {formatDateTime(showtime.end_time)}
                          </div>
                          <div className="text-xs text-blue-600 mt-1">
                            Thời lượng: {showtime.duration}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {getFormatLabel(showtime.format)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {showtime.base_price.toLocaleString('vi-VN')} VNĐ
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={showtime.status}
                          onChange={(e) => handleStatusChange(showtime.id, e.target.value)}
                          className={`text-xs px-2 py-1 rounded-full ${getStatusColor(showtime.status)} border-0`}
                        >
                          {showtimeStatuses.map((status) => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/admin/showtimes/${showtime.id}`}
                            className="text-blue-600 hover:text-blue-900"
                            title="Xem chi tiết"
                          >
                            <FaEye />
                          </Link>
                          <Link
                            to={`/admin/showtimes/${showtime.id}/edit`}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Chỉnh sửa"
                          >
                            <FaEdit />
                          </Link>
                          <button
                            onClick={() => handleDelete(showtime.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Xóa"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {showtimes.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">Không có lịch chiếu nào</p>
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center">
                <nav className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>

                  {(() => {
                    const delta = 2 // Số trang hiện thị ở mỗi bên của trang hiện tại
                    const range = []
                    const rangeWithDots = []

                    // Tính toán các trang cần hiện thị
                    for (
                      let i = Math.max(2, currentPage - delta);
                      i <= Math.min(totalPages - 1, currentPage + delta);
                      i++
                    ) {
                      range.push(i)
                    }

                    // Luôn hiện trang 1
                    if (currentPage - delta > 2) {
                      rangeWithDots.push(1, '...')
                    } else {
                      rangeWithDots.push(1)
                    }

                    // Thêm các trang trong range (nếu không phải trang 1)
                    rangeWithDots.push(...range.filter((page) => page !== 1))

                    // Thêm dấu ... và trang cuối nếu cần
                    if (currentPage + delta < totalPages - 1) {
                      rangeWithDots.push('...', totalPages)
                    } else if (totalPages > 1 && !rangeWithDots.includes(totalPages)) {
                      rangeWithDots.push(totalPages)
                    }

                    return rangeWithDots.map((page, index) => {
                      if (page === '...') {
                        return (
                          <span key={`dots-${index}`} className="px-3 py-2 text-sm text-gray-500">
                            ...
                          </span>
                        )
                      }

                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 text-sm font-medium rounded-md ${
                            currentPage === page
                              ? 'text-blue-600 bg-blue-50 border border-blue-300'
                              : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    })
                  })()}

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                  </button>
                </nav>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}

export default ShowtimesPage
