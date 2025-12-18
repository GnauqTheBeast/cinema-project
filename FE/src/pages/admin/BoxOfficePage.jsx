import { useEffect, useState } from 'react'
import { FaArrowLeft, FaArrowRight, FaCheck, FaFilm, FaCouch, FaCheckCircle } from 'react-icons/fa'
import AdminLayout from '../../components/admin/AdminLayout'
import { movieService } from '../../services/movieService'
import { showtimeService } from '../../services/showtimeApi'
import { clientSeatService } from '../../services/clientSeatService'
import boxOfficeService from '../../services/boxOfficeService'

const BoxOfficePage = () => {
  const [step, setStep] = useState(1)
  const [movies, setMovies] = useState([])
  const [showtimes, setShowtimes] = useState([])
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [selectedShowtime, setSelectedShowtime] = useState(null)
  const [room, setRoom] = useState(null)
  const [seats, setSeats] = useState([])
  const [lockedSeats, setLockedSeats] = useState([])
  const [selectedSeats, setSelectedSeats] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [bookingResult, setBookingResult] = useState(null)

  const seatTypeMultipliers = {
    'regular': 1.0,
    'vip': 1.5,
    'couple': 2.5
  }

  useEffect(() => {
    if (step === 1) {
      fetchShowingMovies()
    }
  }, [step])

  useEffect(() => {
    if (selectedShowtime && step === 2) {
      const intervalId = setInterval(fetchSeats, 5000)
      return () => clearInterval(intervalId)
    }
  }, [selectedShowtime, step])

  const fetchShowingMovies = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await movieService.getShowingMovies()
      
      if (!response.success) {
        setError('Không thể hiển thị danh sách phim và suất chiếu.')
        setMovies([])
        return
      }

      if (!response.data) {
        setMovies([])
        return
      }

      const moviesData = Array.isArray(response.data) ? response.data : 
                         Array.isArray(response.data.data) ? response.data.data : []
      setMovies(moviesData)
    } catch (err) {
      setError('Không thể hiển thị danh sách phim và suất chiếu.')
      setMovies([])
      console.error('Error fetching movies:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchShowtimesByMovie = async (movieId) => {
    try {
      setLoading(true)
      setError('')
      const response = await showtimeService.getShowtimesByMovie(movieId)
      
      if (!response.success) {
        setError('Không thể hiển thị danh sách phim và suất chiếu.')
        setShowtimes([])
        return
      }

      if (!response.data) {
        setShowtimes([])
        return
      }

      const showtimesData = Array.isArray(response.data) ? response.data :
                           Array.isArray(response.data.data) ? response.data.data : []
      
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      const todayShowtimes = showtimesData.filter(st => {
        const showtimeDate = new Date(st.start_time)
        return showtimeDate >= now && showtimeDate < tomorrow
      })
      
      setShowtimes(todayShowtimes)
    } catch (err) {
      setError('Không thể hiển thị danh sách phim và suất chiếu.')
      setShowtimes([])
      console.error('Error fetching showtimes:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchSeats = async () => {
    if (!selectedShowtime) return

    try {
      const response = await clientSeatService.getSeatsByShowtime(selectedShowtime.id)
      
      if (!response.success) {
        setError('Không thể hiển thị sơ đồ ghế.')
        setSeats([])
        return
      }

      if (!response.data) {
        setSeats([])
        setLockedSeats([])
        return
      }

      const seatsData = response.data.data || response.data
      const seatsArray = Array.isArray(seatsData.seats) ? seatsData.seats : 
                        Array.isArray(seatsData) ? seatsData : []
      const lockedArray = Array.isArray(seatsData.locked_seats) ? seatsData.locked_seats : []
      
      setSeats(seatsArray)
      setLockedSeats(lockedArray)
      
      if (selectedSeats.length > 0) {
        const lockedSeatIds = lockedArray.map(s => s.id)
        const updatedSelectedSeats = selectedSeats.filter(seat => !lockedSeatIds.includes(seat.id))
        if (updatedSelectedSeats.length !== selectedSeats.length) {
          setSelectedSeats(updatedSelectedSeats)
        }
      }
    } catch (err) {
      setError('Không thể hiển thị sơ đồ ghế.')
      setSeats([])
      console.error('Error fetching seats:', err)
    }
  }

  const handleMovieSelect = async (movie) => {
    setSelectedMovie(movie)
    setSelectedShowtime(null)
    setShowtimes([])
    await fetchShowtimesByMovie(movie.id)
  }

  const handleShowtimeSelect = async (showtime) => {
    setSelectedShowtime(showtime)
    setRoom(showtime.room)
    setStep(2)
    await fetchSeats()
  }

  const handleSeatSelect = (seat) => {
    if (seat.status !== 'available') return
    
    const lockedSeatIds = lockedSeats.map(s => s.id)
    if (lockedSeatIds.includes(seat.id)) return

    const isSelected = selectedSeats.some(s => s.id === seat.id)
    if (isSelected) {
      setSelectedSeats(selectedSeats.filter(s => s.id !== seat.id))
    } else {
      setSelectedSeats([...selectedSeats, seat])
    }
  }

  const handleConfirmBooking = async () => {
    if (selectedSeats.length === 0) {
      setError('Vui lòng chọn ít nhất một ghế')
      return
    }

    try {
      setLoading(true)
      setError('')

      const bookingData = {
        showtime_id: selectedShowtime.id,
        seat_ids: selectedSeats.map(s => s.id)
      }

      const response = await boxOfficeService.createBoxOfficeBooking(bookingData)
      
      if (!response.success) {
        setError('Bán vé không thành công.')
        return
      }

      setBookingResult(response.data)
      setSuccess(true)
      setStep(3)
    } catch (err) {
      setError('Bán vé không thành công.')
      console.error('Error creating booking:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleNewBooking = () => {
    setStep(1)
    setSelectedMovie(null)
    setSelectedShowtime(null)
    setRoom(null)
    setSeats([])
    setLockedSeats([])
    setSelectedSeats([])
    setError('')
    setSuccess(false)
    setBookingResult(null)
  }

  const createSeatGrid = () => {
    if (!seats || seats.length === 0) return {}

    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O']
    const coupleRows = ['M', 'N', 'O']
    const grid = {}

    rows.forEach((row) => {
      grid[row] = {}
      const seatsPerRow = coupleRows.includes(row) ? 5 : 16
      for (let i = 1; i <= seatsPerRow; i++) {
        grid[row][i] = null
      }
    })

    seats.forEach((seat) => {
      const seatNum = parseInt(seat.seat_number)
      if (grid[seat.row_number] && grid[seat.row_number][seatNum] !== undefined) {
        grid[seat.row_number][seatNum] = seat
      }
    })

    return grid
  }

  const getSeatColor = (seat) => {
    const isSelected = selectedSeats.some(s => s.id === seat.id)
    const isLocked = lockedSeats.some(s => s.id === seat.id)
    
    if (isSelected) return 'bg-green-500 text-white hover:bg-green-600'
    if (isLocked) return 'bg-orange-400 text-white cursor-not-allowed'
    if (seat.status !== 'available') return 'bg-gray-400 text-white cursor-not-allowed'
    
    if (seat.seat_type === 'vip') return 'bg-yellow-100 hover:bg-yellow-200 border-yellow-400'
    if (seat.seat_type === 'couple') return 'bg-pink-100 hover:bg-pink-200 border-pink-400'
    
    return 'bg-blue-100 hover:bg-blue-200 border-blue-400'
  }

  const calculateTotal = () => {
    if (!selectedShowtime || selectedSeats.length === 0) return 0
    
    const basePrice = selectedShowtime.price || 50000
    return selectedSeats.reduce((total, seat) => {
      const multiplier = seatTypeMultipliers[seat.seat_type] || 1.0
      return total + (basePrice * multiplier)
    }, 0)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount)
  }

  const formatDateTime = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (success && step === 3) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-green-100 rounded-full p-6">
                <FaCheckCircle className="text-6xl text-green-600" />
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Bán vé thành công!</h2>
            <p className="text-gray-600 mb-8">Vé đã được tạo và lưu vào hệ thống</p>

            {bookingResult && (
              <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
                <h3 className="text-lg font-semibold mb-4">Thông tin đặt vé</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Mã đặt vé:</span> {bookingResult.id}</p>
                  <p><span className="font-medium">Phim:</span> {selectedMovie?.title}</p>
                  <p><span className="font-medium">Suất chiếu:</span> {formatDateTime(selectedShowtime?.start_time)}</p>
                  <p><span className="font-medium">Phòng:</span> {room?.name}</p>
                  <p><span className="font-medium">Ghế:</span> {selectedSeats.map(s => `${s.row_number}${s.seat_number}`).join(', ')}</p>
                  <p><span className="font-medium">Tổng tiền:</span> <span className="text-green-600 font-semibold">{formatCurrency(calculateTotal())}</span></p>
                </div>
              </div>
            )}

            <button
              onClick={handleNewBooking}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <FaCheck />
              Bán vé mới
            </button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bán vé tại quầy</h1>
            <p className="text-gray-600">Chọn phim, suất chiếu và ghế cho khách hàng</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${step >= 1 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
              <FaFilm />
              <span className="font-medium">Chọn phim</span>
            </div>
            <FaArrowRight className="text-gray-400" />
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${step >= 2 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
              <FaCouch />
              <span className="font-medium">Chọn ghế</span>
            </div>
            <FaArrowRight className="text-gray-400" />
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${step >= 3 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
              <FaCheck />
              <span className="font-medium">Hoàn tất</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            {selectedMovie && (
              <button
                onClick={() => {
                  setSelectedMovie(null)
                  setSelectedShowtime(null)
                  setShowtimes([])
                }}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <FaArrowLeft />
                Quay lại danh sách phim
              </button>
            )}

            {!selectedMovie ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4">Danh sách phim đang chiếu</h2>
                
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : movies.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    Không có phim đang chiếu
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {movies.map((movie) => (
                      <div
                        key={movie.id}
                        onClick={() => handleMovieSelect(movie)}
                        className="border rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-colors"
                      >
                        {movie.poster_url && (
                          <img
                            src={movie.poster_url}
                            alt={movie.title}
                            className="w-full h-48 object-cover rounded-lg mb-3"
                          />
                        )}
                        <h3 className="font-semibold text-lg mb-2">{movie.title}</h3>
                        <p className="text-sm text-gray-600">{movie.duration} phút</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4">Chọn suất chiếu - {selectedMovie.title}</h2>
                
                {loading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : showtimes.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    Không có suất chiếu sắp tới
                  </div>
                ) : (
                  <div className="space-y-3">
                    {showtimes.map((showtime) => (
                      <div
                        key={showtime.id}
                        onClick={() => handleShowtimeSelect(showtime)}
                        className="border rounded-lg p-4 hover:border-blue-500 cursor-pointer transition-colors flex justify-between items-center"
                      >
                        <div>
                          <p className="font-semibold">{formatDateTime(showtime.start_time)}</p>
                          <p className="text-sm text-gray-600">
                            Phòng: {showtime.room?.name} | {showtime.format?.toUpperCase()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-green-600">
                            {formatCurrency(showtime.price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {step === 2 && selectedShowtime && (
          <div className="space-y-6">
            <button
              onClick={() => {
                setStep(1)
                setSelectedSeats([])
                setSeats([])
                setLockedSeats([])
              }}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <FaArrowLeft />
              Quay lại chọn suất chiếu
            </button>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">Chọn ghế</h2>
                <div className="text-sm text-gray-600">
                  <p>Phim: <span className="font-medium">{selectedMovie?.title}</span></p>
                  <p>Suất chiếu: <span className="font-medium">{formatDateTime(selectedShowtime.start_time)}</span></p>
                  <p>Phòng: <span className="font-medium">{room?.name}</span></p>
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-center justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 border border-blue-400 rounded"></div>
                    <span>Thường</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-yellow-100 border border-yellow-400 rounded"></div>
                    <span>VIP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-pink-100 border border-pink-400 rounded"></div>
                    <span>Đôi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-500 rounded"></div>
                    <span>Đã chọn</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-400 rounded"></div>
                    <span>Đã đặt</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-orange-400 rounded"></div>
                    <span>Đang giữ</span>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <div className="bg-gray-800 text-white text-center py-2 rounded-t-lg mb-8">
                  MÀN HÌNH
                </div>

                {loading && seats.length === 0 ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(createSeatGrid()).map(([row, rowSeats]) => (
                      <div key={row} className="flex items-center justify-center gap-2">
                        <div className="w-8 text-center font-semibold">{row}</div>
                        <div className="flex gap-2">
                          {Object.entries(rowSeats).map(([num, seat]) => (
                            <button
                              key={`${row}-${num}`}
                              onClick={() => seat && handleSeatSelect(seat)}
                              disabled={!seat || seat.status !== 'available' || lockedSeats.some(s => s.id === seat?.id)}
                              className={`w-10 h-10 rounded border-2 flex items-center justify-center text-xs font-semibold transition-colors ${
                                seat ? getSeatColor(seat) : 'invisible'
                              }`}
                            >
                              {seat && num}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedSeats.length > 0 && (
                <div className="border-t pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Ghế đã chọn:</p>
                      <p className="font-semibold">
                        {selectedSeats.map(s => `${s.row_number}${s.seat_number}`).join(', ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Tổng tiền:</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(calculateTotal())}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleConfirmBooking}
                    disabled={loading || selectedSeats.length === 0}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Đang xử lý...</span>
                      </>
                    ) : (
                      <>
                        <FaCheck />
                        <span>Xác nhận bán vé</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default BoxOfficePage

