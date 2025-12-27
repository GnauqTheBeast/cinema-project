import { useEffect, useState } from 'react'
import { FaCalendarAlt, FaClock, FaEdit, FaEye, FaPlus, FaSearch, FaTrash } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import AdminLayout from '../../components/admin/AdminLayout'
import { showtimeService } from '../../services/showtimeApi'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import LoadingSpinner from '../../components/common/LoadingSpinner'

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
        const showtimesData = response.data.data || []
        setShowtimes(showtimesData)
        setTotalPages(response.data.paging?.total_pages || 1)

        const uniqueMovies = []
        const uniqueRooms = []
        const movieIds = new Set()
        const roomIds = new Set()

        showtimesData.forEach((showtime) => {
          if (showtime.movie && !movieIds.has(showtime.movie.id)) {
            uniqueMovies.push(showtime.movie)
            movieIds.add(showtime.movie.id)
          }
          if (showtime.room && !roomIds.has(showtime.room.id)) {
            uniqueRooms.push(showtime.room)
            roomIds.add(showtime.room.id)
          }
        })

        setMovies(uniqueMovies)
        setRooms(uniqueRooms)
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
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800'
      case 'ONGOING':
        return 'bg-green-100 text-green-800'
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800'
      case 'CANCELED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getFormatLabel = (format) => {
    const formatObj = showtimeFormats.find((f) => f.value === format)
    return formatObj ? formatObj.label : format
  }

  const getRoomName = (showtime) => {
    return showtime.room ? `Phòng ${showtime.room.room_number}` : showtime.room_id
  }

  const getMovieName = (showtime) => {
    return showtime.movie ? showtime.movie.title : showtime.movie_id
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
    return startTime > now && showtime.status === 'SCHEDULED'
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <Card>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Lịch chiếu</h1>
              <p className="text-gray-600">Quản lý lịch chiếu phim với tính năng làm tròn 30 phút</p>
            </div>
            <Link to="/admin/showtimes/new">
              <Button>
                <FaPlus />
                <span>Thêm lịch chiếu mới</span>
              </Button>
            </Link>
          </div>
        </Card>

        <Card>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm lịch chiếu..."
                value={search}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 outline-none"
              />
            </div>

            <select
              value={selectedMovie}
              onChange={(e) => {
                setSelectedMovie(e.target.value)
                setCurrentPage(1)
              }}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 outline-none"
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
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 outline-none"
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
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 outline-none"
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
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 outline-none"
            >
              <option value="">Tất cả trạng thái</option>
              {showtimeStatuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>

            <div className="relative">
              <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 outline-none"
                placeholder="Từ ngày"
              />
            </div>

            <div className="relative">
              <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 outline-none"
                placeholder="Đến ngày"
              />
            </div>

            <Button
              variant="secondary"
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
            >
              Xóa bộ lọc
            </Button>
          </div>
        </Card>

        {loading ? (
          <LoadingSpinner size="lg" text="Đang tải danh sách lịch chiếu..." />
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-start">
              <span className="text-red-500 text-xl mr-3">⚠</span>
              <div>
                <h3 className="text-sm font-semibold text-red-800">Lỗi tải dữ liệu</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <Card padding="none">
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
                          {getMovieName(showtime)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{getRoomName(showtime)}</div>
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
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🎬</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có lịch chiếu nào</h3>
                  <p className="text-gray-500">Hãy thêm lịch chiếu đầu tiên vào hệ thống</p>
                </div>
              )}
            </Card>

            {totalPages > 1 && (
              <Card>
                <div className="flex justify-center">
                  <nav className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      ← Trước
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
                          className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                            currentPage === page
                              ? 'bg-red-600 text-white font-semibold'
                              : 'text-gray-600 hover:bg-gray-100'
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
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Sau →
                    </button>
                  </nav>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}

export default ShowtimesPage
