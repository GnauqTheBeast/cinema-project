import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import AdminLayout from '../../components/admin/AdminLayout'
import ShowtimeRevenueModal from '../../components/admin/ShowtimeRevenueModal'
import analyticsService from '../../services/analyticsService'

const COLORS = ['#10B981', '#22C55E', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5']

export default function RevenueStatsPage() {
  const [monthlyData, setMonthlyData] = useState([])
  const [movieData, setMovieData] = useState([])
  const [genreData, setGenreData] = useState([])
  const [overallStats, setOverallStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 6))
      .toISOString()
      .split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  })
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [showtimeData, setShowtimeData] = useState([])
  const [showtimeLoading, setShowtimeLoading] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        const [timeData, movieRevenueData, genreRevenueData, totalRevenueData] =
          await Promise.all([
            analyticsService.getRevenueByTime(dateRange.startDate, dateRange.endDate, 180),
            analyticsService.getRevenueByMovie(dateRange.startDate, dateRange.endDate, 10),
            analyticsService.getRevenueByGenre(dateRange.startDate, dateRange.endDate),
            analyticsService.getTotalRevenue(dateRange.startDate, dateRange.endDate),
          ])

        const monthlyGrouped = {}
        if (timeData.success && timeData.data) {
          timeData.data.forEach((item) => {
            const date = new Date(item.time_period)
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            const monthName = date.toLocaleDateString('vi-VN', { month: 'short', year: 'numeric' })

            if (!monthlyGrouped[monthKey]) {
              monthlyGrouped[monthKey] = {
                monthName,
                revenue: 0,
                bookings: 0,
              }
            }

            monthlyGrouped[monthKey].revenue += item.total_revenue
            monthlyGrouped[monthKey].bookings += item.total_bookings
          })
        }

        const monthly = Object.keys(monthlyGrouped)
          .sort((a, b) => a.localeCompare(b))
          .map(key => monthlyGrouped[key])

        const movies =
          movieRevenueData.success && movieRevenueData.data
            ? movieRevenueData.data.map((movie) => ({
              movie_id: movie.movie_id,
              title: movie.movie_title,
              revenue: movie.total_revenue,
              revenueFormatted: formatCurrency(movie.total_revenue),
              ticketsSold: movie.total_tickets,
              genre: 'N/A',
            }))
            : []

        const genres =
          genreRevenueData.success && genreRevenueData.data
            ? genreRevenueData.data.map((genre) => ({
              genre: genre.genre,
              revenue: genre.total_revenue,
              revenueFormatted: formatCurrency(genre.total_revenue),
            }))
            : []

        const totalRevenue = totalRevenueData.success ? totalRevenueData.data.total_revenue : 0
        const totalTickets =
          movieRevenueData.success && movieRevenueData.data
            ? movieRevenueData.data.reduce((sum, movie) => sum + movie.total_tickets, 0)
            : 0
        const totalBookings =
          movieRevenueData.success && movieRevenueData.data
            ? movieRevenueData.data.reduce((sum, movie) => sum + movie.total_bookings, 0)
            : 0

        setMonthlyData(monthly)
        setMovieData(movies)
        setGenreData(genres)
        setOverallStats({
          totalRevenue,
          totalRevenueFormatted: formatCurrency(totalRevenue),
          totalTickets,
          totalBookings,
          averageTicketPriceFormatted:
            totalTickets > 0 ? formatCurrency(totalRevenue / totalTickets) : formatCurrency(0),
        })
      } catch (error) {
        console.error('Error loading revenue data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [dateRange])

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const handleMovieClick = async (movie) => {
    setSelectedMovie(movie)
    setShowtimeLoading(true)

    try {
      const result = await analyticsService.getRevenueByShowtime(
        dateRange.startDate,
        dateRange.endDate,
        movie.movie_id,
        1000,
      )

      if (result.success) {
        setShowtimeData(result.data)
      }
    } catch (error) {
      console.error('Error loading showtime analytics:', error)
      setShowtimeData([])
    } finally {
      setShowtimeLoading(false)
    }
  }

  const handleCloseModal = () => {
    setSelectedMovie(null)
    setShowtimeData([])
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-md">
          <p className="mb-2 font-semibold text-gray-900 text-sm">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="m-0 text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const tabs = [
    { id: 'overview', label: 'Tổng quan' },
    { id: 'monthly', label: 'Theo tháng' },
    { id: 'movies', label: 'Theo phim' },
    // { id: 'genres', label: 'Theo thể loại' },
  ]

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-16 px-6">
          <div className="w-10 h-10 border-3 border-gray-100 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">Đang tải thống kê doanh thu...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div>
        <div className="mb-8">
          <h2 className="m-0 mb-2 text-3xl font-bold tracking-tight text-gray-900">Doanh Thu</h2>
          <p className="m-0 text-gray-500 text-sm">Thống kê doanh thu một cách toàn diện</p>
        </div>

        <div className="flex gap-2 mb-6 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                ? 'bg-gradient-to-br from-emerald-500 to-red-600 text-white font-semibold'
                : 'bg-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="m-0 mb-2 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                  Tổng doanh thu
                </h3>
                <p className="m-0 text-3xl font-bold text-emerald-500">
                  {overallStats.totalRevenueFormatted}
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="m-0 mb-2 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                  Tổng vé bán
                </h3>
                <p className="m-0 text-3xl font-bold text-gray-900">
                  {overallStats.totalTickets?.toLocaleString()}
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="m-0 mb-2 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                  Giá vé trung bình
                </h3>
                <p className="m-0 text-3xl font-bold text-gray-900">
                  {overallStats.averageTicketPriceFormatted}
                </p>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="m-0 mb-2 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                  Tổng đơn đặt
                </h3>
                <p className="m-0 text-3xl font-bold text-gray-900">
                  {overallStats.totalBookings?.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="m-0 mb-4 text-lg font-semibold text-gray-900">Doanh thu theo thể loại</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={genreData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ genre }) => genre}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                    >
                      {genreData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="m-0 mb-4 text-lg font-semibold text-gray-900">Xu hướng theo tháng</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="monthName" tick={{ fontSize: 12, fill: '#6B7280' }} stroke="#E5E7EB" />
                    <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12, fill: '#6B7280' }} stroke="#E5E7EB" />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10B981"
                      strokeWidth={3}
                      dot={{ fill: '#FFFFFF', stroke: '#10B981', strokeWidth: 2, r: 5 }}
                      name="Doanh thu"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'monthly' && (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="m-0 mb-4 text-lg font-semibold text-gray-900">
              Doanh Thu Hàng Tháng
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="monthName" tick={{ fontSize: 12, fill: '#6B7280' }} stroke="#E5E7EB" />
                <YAxis tickFormatter={formatCurrency} tick={{ fontSize: 12, fill: '#6B7280' }} stroke="#E5E7EB" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 14 }} />
                <Bar dataKey="revenue" fill="#10B981" name="Doanh thu" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'movies' && (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="m-0 mb-4 text-lg font-semibold text-gray-900">
              Doanh Thu Theo Phim
            </h3>
            {movieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={500}>
                <BarChart data={movieData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <XAxis
                    dataKey="title"
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    height={100}
                    stroke="#E5E7EB"
                  />
                  <YAxis
                    tickFormatter={formatCurrency}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    stroke="#E5E7EB"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 14 }} />
                  <Bar dataKey="revenue" fill="#10B981" name="Doanh thu" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-16">
                <p className="text-gray-500">Không có dữ liệu doanh thu theo phim</p>
              </div>
            )}

            <div className="mt-8">
              <h4 className="m-0 mb-1 text-base font-semibold text-gray-900">
                Chi Tiết Doanh Thu Theo Phim
              </h4>
              <p className="text-sm text-gray-500 m-0 mb-4">
                Click để xem chi tiết
              </p>
              <div className="overflow-x-auto border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-4 text-left border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Phim
                      </th>
                      <th className="px-4 py-4 text-right border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Doanh thu
                      </th>
                      <th className="px-4 py-4 text-right border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Vé bán
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {movieData.map((movie, index) => (
                      <tr
                        key={index}
                        onClick={() => handleMovieClick(movie)}
                        className="cursor-pointer transition-colors border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-4 py-4 text-sm text-gray-900">{movie.title}</td>
                        <td className="px-4 py-4 text-right text-sm font-semibold text-gray-900">
                          {movie.revenueFormatted}
                        </td>
                        <td className="px-4 py-4 text-right text-sm text-gray-900">
                          {movie.ticketsSold.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'genres' && (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="m-0 mb-4 text-lg font-semibold text-gray-900">Doanh thu theo thể loại</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={genreData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ genre, revenue }) =>
                      `${genre}: ${((revenue / overallStats.totalRevenue) * 100).toFixed(1)}%`
                    }
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="revenue"
                  >
                    {genreData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 14 }} />
                </PieChart>
              </ResponsiveContainer>

              <div>
                <h4 className="m-0 mb-4 text-base font-semibold text-gray-900">Phân tích theo thể loại</h4>
                {genreData.map((genre, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center px-4 py-3 mb-2 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="font-semibold text-gray-900 text-sm">{genre.genre}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900 text-base">
                        {genre.revenueFormatted}
                      </div>
                      <div className="text-xs text-gray-500">
                        {((genre.revenue / overallStats.totalRevenue) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedMovie && (
        <ShowtimeRevenueModal
          movie={selectedMovie}
          showtimes={showtimeData}
          dateRange={dateRange}
          onClose={handleCloseModal}
          formatCurrency={formatCurrency}
          loading={showtimeLoading}
        />
      )}
    </AdminLayout>
  )
}