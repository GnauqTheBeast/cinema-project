import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FaCouch, FaArrowLeft, FaShoppingCart, FaCreditCard } from 'react-icons/fa'
import Header from '../../components/Header'
import { movieService } from '../../services/movieService'
import { showtimeService } from '../../services/showtimeApi'
import { clientSeatService } from '../../services/clientSeatService'
import { bookingService } from '../../services/bookingService'

const BookingPage = () => {
  const { showtimeId } = useParams()
  const navigate = useNavigate()
  
  const seatTypeMultipliers = {
    'REGULAR': 1.0,
    'VIP': 1.5,
    'COUPLE': 2.5
  }

  const getSeatTypeLabel = (type) => {
    const labels = {
      'REGULAR': 'Ghế thường',
      'VIP': 'Ghế VIP',
      'COUPLE': 'Ghế đôi'
    }
    return labels[type] || type
  }

  const [movie, setMovie] = useState(null)
  const [showtime, setShowtime] = useState(null)
  const [room, setRoom] = useState(null)
  const [seats, setSeats] = useState([])
  const [lockedSeats, setLockedSeats] = useState([])
  const [selectedSeats, setSelectedSeats] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)

  useEffect(() => {
    fetchBookingData()
  }, [showtimeId])

  useEffect(() => {
    if (!showtimeId || step !== 1) {
      return
    }

    const pollLockedSeats = async () => {
      try {
        const seatsResponse = await clientSeatService.getSeatsByShowtime(showtimeId)
        if (seatsResponse.success) {
          const seatsData = seatsResponse.data.data || seatsResponse.data
          const newLockedSeats = seatsData.locked_seats || []
          setLockedSeats(newLockedSeats)

          if (selectedSeats.length > 0) {
            const lockedSeatIds = newLockedSeats.map(s => s.id)
            const updatedSelectedSeats = selectedSeats.filter(seat => !lockedSeatIds.includes(seat.id))
            if (updatedSelectedSeats.length !== selectedSeats.length) {
              setSelectedSeats(updatedSelectedSeats)
            }
          }
        }
      } catch (err) {
        console.error('Error polling locked seats:', err)
      }
    }

    const intervalId = setInterval(pollLockedSeats, 5000)

    return () => clearInterval(intervalId)
  }, [showtimeId, step, selectedSeats])

  const fetchBookingData = async () => {
    try {
      setLoading(true)
      
      const showtimeResponse = await showtimeService.getShowtimeById(showtimeId)
      if (showtimeResponse.success) {
        const showtimeData = showtimeResponse.data
        setShowtime(showtimeData)
        setRoom(showtimeData.room)
        
        const movieResponse = await movieService.getMovieById(showtimeData.movie_id)
        if (movieResponse.success) {
          setMovie(movieResponse.data)
        }

        const seatsResponse = await clientSeatService.getSeatsByShowtime(showtimeId)
        if (seatsResponse.success) {
          const seatsData = seatsResponse.data.data || seatsResponse.data
          setSeats(seatsData.seats || seatsData)
          setLockedSeats(seatsData.locked_seats || [])
        }
      } else {
        setError('Không tìm thấy suất chiếu')
      }
    } catch (err) {
      setError('Có lỗi xảy ra khi tải dữ liệu')
      console.error('Error fetching booking data:', err)
    } finally {
      setLoading(false)
    }
  }

  const createSeatGrid = () => {
    if (!seats || !Array.isArray(seats) || seats.length === 0) {
      return {}
    }

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
    if (isSelected) {
      return 'bg-red-600 border-red-500 text-white'
    }

    if (seat.status === 'OCCUPIED') {
      return 'bg-gray-500 border-gray-400 text-gray-300 cursor-not-allowed'
    }

    if (seat.status === 'MAINTENANCE' || seat.status === 'BLOCKED') {
      return 'bg-gray-700 border-gray-600 text-gray-400 cursor-not-allowed'
    }

    const isLocked = lockedSeats && lockedSeats.some(lockedSeat => lockedSeat.id === seat.id)
    if (isLocked) {
      return 'bg-orange-600 border-orange-500 text-orange-200 cursor-not-allowed'
    }

    switch (seat.seat_type) {
      case 'REGULAR':
        return 'bg-green-600 border-green-500 text-white hover:bg-green-500 cursor-pointer'
      case 'VIP':
        return 'bg-yellow-600 border-yellow-500 text-white hover:bg-yellow-500 cursor-pointer'
      case 'COUPLE':
        return 'bg-pink-600 border-pink-500 text-white hover:bg-pink-500 cursor-pointer'
      default:
        return 'bg-green-600 border-green-500 text-white hover:bg-green-500 cursor-pointer'
    }
  }

  const handleSeatClick = (seat) => {
    if (!seat || seat.status === 'OCCUPIED' || seat.status === 'MAINTENANCE' || seat.status === 'BLOCKED') {
      return
    }

    const isLocked = lockedSeats && lockedSeats.some(lockedSeat => lockedSeat.id === seat.id)
    if (isLocked) {
      return
    }

    const isSelected = selectedSeats.some(s => s.id === seat.id)
    
    if (isSelected) {
      setSelectedSeats(selectedSeats.filter(s => s.id !== seat.id))
    } else {
      if (selectedSeats.length >= 10) {
        alert('Không được đặt nhiều hơn 10 ghế cùng một lúc')
        return
      }
      setSelectedSeats([...selectedSeats, seat])
    }
  }

  const getSeatPrice = (seatType) => {
    if (!showtime || !showtime.base_price) {
      return 0
    }
    const multiplier = seatTypeMultipliers[seatType] || 1.0
    return showtime.base_price * multiplier
  }

  const calculateTotal = () => {
    return selectedSeats.reduce((total, seat) => {
      return total + getSeatPrice(seat.seat_type)
    }, 0)
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price)
  }

  const handleProceedToPayment = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login')
      return
    }

    if (selectedSeats.length === 0) {
      alert('Vui lòng chọn ít nhất một ghế')
      return
    }

    try {
      const bookingData = {
        showtime_id: showtimeId,
        seat_ids: selectedSeats.map(seat => seat.id),
        total_amount: calculateTotal(),
        booking_type: 'ONLINE'
      }

      const response = await bookingService.createBooking(bookingData)
      if (response.code === 200) {
        navigate(`/booking/${response.data.id}/payment`)
      }
    } catch (err) {
      if (err.response?.status === 400 && err.response?.data?.error === 'Seat already booked') {
        alert('Một hoặc nhiều ghế bạn chọn đã được đặt bởi người khác. Vui lòng chọn ghế khác.')
        setSelectedSeats([])
        fetchBookingData()
      } else if (err.response?.data?.error) {
        alert(err.response.data.error)
      } else {
        alert('Có lỗi xảy ra khi tạo booking')
      }
      console.error('Error creating booking:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-300"
          >
            Quay lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      {/* Page Header */}
      <div className="bg-gray-900 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors duration-300"
            >
              <FaArrowLeft />
              Quay lại
            </button>
            <h1 className="text-xl font-semibold text-white">Đặt vé</h1>
            <div className="w-24"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Movie Info */}
          <div className="lg:col-span-2">
            {movie && (
              <div className="bg-gray-900 rounded-xl shadow-lg p-6 mb-6 border border-gray-800">
                <div className="flex gap-6">
                  <img
                    src={movie.poster_url}
                    alt={movie.title}
                    className="w-32 h-48 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2">{movie.title}</h2>
                    <p className="text-gray-300 mb-4">{movie.description}</p>
                    <div className="space-y-2">
                      <p className="text-gray-300"><span className="font-medium text-white">Thể loại:</span> {movie.genre}</p>
                      <p className="text-gray-300"><span className="font-medium text-white">Thời lượng:</span> {movie.duration} phút</p>
                      <p className="text-gray-300"><span className="font-medium text-white">Đạo diễn:</span> {movie.director}</p>
                      <p className="text-gray-300"><span className="font-medium text-white">Diễn viên:</span> {movie.cast}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showtime && room && (
              <div className="bg-gray-900 rounded-xl shadow-lg p-6 mb-6 border border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-4">Thông tin suất chiếu</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-400">Phòng chiếu</p>
                    <p className="font-medium text-white">Phòng {room.room_number} - {room.room_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Thời gian</p>
                    <p className="font-medium text-white">
                      {new Date(showtime.start_time).toLocaleDateString('vi-VN')} - 
                      {new Date(showtime.start_time).toLocaleTimeString('vi-VN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Định dạng</p>
                    <p className="font-medium text-white uppercase">{showtime.format}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Giá cơ bản</p>
                    <p className="font-medium text-red-400">{formatPrice(showtime.base_price)}</p>
                  </div>
                </div>
                <div className="border-t border-gray-700 pt-4">
                  <p className="text-sm text-gray-400 mb-2">Bảng giá theo loại ghế:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Ghế thường:</span>
                      <span className="text-white">{formatPrice(getSeatPrice('regular'))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Ghế VIP:</span>
                      <span className="text-white">{formatPrice(getSeatPrice('vip'))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Ghế đôi:</span>
                      <span className="text-white">{formatPrice(getSeatPrice('COUPLE'))}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Seat Selection */}
            {step === 1 && (
              <div className="bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-4">Chọn ghế ngồi</h3>
                
                {seats.length > 0 ? (
                  /* Cinema Layout */
                  <div className="flex flex-col items-center">
                    {/* Screen */}
                    <div className="mb-8">
                      <div className="bg-gray-800 text-white py-3 px-16 rounded-lg text-sm font-medium shadow-lg">
                        MÀN HÌNH
                      </div>
                      <div className="text-center text-xs text-gray-500 mt-1">SCREEN</div>
                    </div>

                    {/* Seat Grid */}
                    <div className="overflow-x-auto">
                      <div className="inline-block">
                        {Object.entries(createSeatGrid())
                          .filter(([_, rowSeats]) => {
                            return Object.values(rowSeats).some(seat => seat !== null)
                          })
                          .map(([row, rowSeats]) => {
                            const coupleRows = ['M', 'N', 'O']
                            return (
                            <div key={row} className="flex items-center justify-center mb-3">
                              <div className="w-8 text-center text-sm font-bold text-gray-300 mr-4">
                                {row}
                              </div>

                              {/* Seats */}
                              <div className={`flex ${coupleRows.includes(row) ? 'gap-3' : 'gap-1'} justify-center`}>
                                {Object.entries(rowSeats)
                                  .filter(([_, seat]) => seat !== null)
                                  .map(([seatNumber, seat]) => {
                                    const isCouple = seat.seat_type === 'COUPLE'
                                    return (
                                      <button
                                        key={`${row}-${seatNumber}`}
                                        onClick={() => handleSeatClick(seat)}
                                        className={`${isCouple ? 'w-12' : 'w-8'} h-8 border-2 rounded text-xs font-semibold transition-all hover:scale-110 ${getSeatColor(seat)}`}
                                        title={`${row}${seatNumber.padStart(2, '0')} - ${getSeatTypeLabel(seat.seat_type)} - ${formatPrice(getSeatPrice(seat.seat_type))}`}
                                      >
                                        {isCouple ? (
                                          <div className="flex items-center justify-center">
                                            <FaCouch className="w-3 h-3" />
                                          </div>
                                        ) : (
                                          seatNumber.padStart(2, '0')
                                        )}
                                      </button>
                                    )
                                  })}
                              </div>

                              {/* Row Label Right */}
                              <div className="w-8 text-center text-sm font-bold text-gray-300 ml-4">
                                {row}
                              </div>
                            </div>
                            )
                          })}
                      </div>
                    </div>

                    {/* Entrance */}
                    <div className="mt-8 text-center">
                      <div className="text-xs text-gray-500 mb-2">ENTRANCE</div>
                      <div className="w-24 h-1 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">Đang tải ghế...</p>
                  </div>
                )}

                {/* Legend */}
                <div className="mt-6 pt-4 border-t border-gray-700">
                  <h4 className="text-sm font-medium text-white mb-3">Chú thích:</h4>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-300">
                      <span className="inline-block w-4 h-4 bg-green-600 border border-green-500 rounded"></span>
                      Thường
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <span className="inline-block w-4 h-4 bg-yellow-600 border border-yellow-500 rounded"></span>
                      VIP
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <span className="inline-block w-4 h-4 bg-pink-600 border border-pink-500 rounded"></span>
                      Đôi
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <span className="inline-block w-4 h-4 bg-red-600 border border-red-500 rounded"></span>
                      Đã chọn
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <span className="inline-block w-4 h-4 bg-gray-500 border border-gray-400 rounded"></span>
                      Đã đặt
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <span className="inline-block w-4 h-4 bg-orange-600 border border-orange-500 rounded"></span>
                      Đang được đặt
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Step */}
            {step === 2 && (
              <div className="bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-800">
                <h3 className="text-lg font-semibold text-white mb-4">Xác nhận thanh toán</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-white mb-2">Ghế đã chọn:</h4>
                    <div className="space-y-2">
                      {selectedSeats.map((seat) => (
                        <div key={seat.id} className="flex justify-between items-center py-2 px-3 bg-gray-800 rounded-lg border border-gray-700">
                          <span className="font-medium text-white">
                            {seat.row_number}{seat.seat_number.toString().padStart(2, '0')} - {getSeatTypeLabel(seat.seat_type)}
                          </span>
                          <span className="text-red-400 font-medium">
                            {formatPrice(getSeatPrice(seat.seat_type))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span className="text-white">Tổng cộng:</span>
                      <span className="text-red-400">{formatPrice(calculateTotal())}</span>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={() => setStep(1)}
                      className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-lg hover:bg-gray-700 transition-colors duration-300"
                    >
                      Quay lại
                    </button>
                    <button
                      onClick={handleProceedToPayment}
                      className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors duration-300 flex items-center justify-center gap-2"
                    >
                      <FaCreditCard />
                      Thanh toán
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 rounded-xl shadow-lg p-6 sticky top-6 border border-gray-800">
              <h3 className="text-lg font-semibold text-white mb-4">Tóm tắt đặt vé</h3>
              
              {movie && (
                <div className="mb-4">
                  <img
                    src={movie.poster_url}
                    alt={movie.title}
                    className="w-full h-48 object-cover rounded-lg mb-3"
                  />
                  <h4 className="font-medium text-white">{movie.title}</h4>
                </div>
              )}

              {showtime && (
                <div className="space-y-2 text-sm text-gray-300 mb-4">
                  <p><span className="font-medium text-white">Phòng:</span> {room?.room_number}</p>
                  <p><span className="font-medium text-white">Thời gian:</span> {new Date(showtime.start_time).toLocaleString('vi-VN')}</p>
                </div>
              )}

              <div className="space-y-2">
                <h4 className="font-medium text-white">Ghế đã chọn:</h4>
                {selectedSeats.length === 0 ? (
                  <p className="text-gray-400 text-sm">Chưa chọn ghế nào</p>
                ) : (
                  <div className="space-y-1">
                    {selectedSeats.map((seat) => (
                      <div key={seat.id} className="flex justify-between text-sm">
                        <span className="text-gray-300">{seat.row_number}{seat.seat_number.toString().padStart(2, '0')}</span>
                        <span className="text-red-400">{formatPrice(getSeatPrice(seat.seat_type))}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedSeats.length > 0 && (
                <div className="border-t border-gray-700 pt-4 mt-4">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-white">Tổng cộng:</span>
                    <span className="text-red-400">{formatPrice(calculateTotal())}</span>
                  </div>
                </div>
              )}

              {step === 1 && selectedSeats.length > 0 && (
                <button
                  onClick={handleProceedToPayment}
                  className="w-full mt-4 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors duration-300 flex items-center justify-center gap-2"
                >
                  <FaShoppingCart />
                  Tiếp tục thanh toán
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingPage
