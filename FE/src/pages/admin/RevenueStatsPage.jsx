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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

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

        const monthly = Object.values(monthlyGrouped)

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
        <div
          style={{
            backgroundColor: 'white',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ margin: '0', color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const tabs = [
    { id: 'overview', label: '📊 Overview', icon: '📊' },
    { id: 'monthly', label: '📅 Monthly', icon: '📅' },
    { id: 'movies', label: '🎬 By Movies', icon: '🎬' },
    { id: 'genres', label: '🎭 By Genres', icon: '🎭' },
  ]

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div>Loading revenue statistics...</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div>
        {/* Page Header */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 'bold' }}>
            Revenue Statistics
          </h2>
          <p style={{ margin: 0, color: '#666' }}>Comprehensive revenue analysis and insights</p>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '24px',
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: 'white',
            padding: '16px',
            borderRadius: '8px 8px 0 0',
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 24px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? '#1976d2' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#666',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                transition: 'all 0.2s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            {/* Stats Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '16px',
                marginBottom: '32px',
              }}
            >
              <div
                style={{
                  backgroundColor: 'white',
                  padding: '24px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  borderLeft: '4px solid #4caf50',
                }}
              >
                <h3 style={{ margin: '0 0 8px 0', color: '#4caf50' }}>Total Revenue</h3>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
                  {overallStats.totalRevenueFormatted}
                </p>
              </div>

              <div
                style={{
                  backgroundColor: 'white',
                  padding: '24px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  borderLeft: '4px solid #2196f3',
                }}
              >
                <h3 style={{ margin: '0 0 8px 0', color: '#2196f3' }}>Total Tickets</h3>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
                  {overallStats.totalTickets?.toLocaleString()}
                </p>
              </div>

              <div
                style={{
                  backgroundColor: 'white',
                  padding: '24px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  borderLeft: '4px solid #ff9800',
                }}
              >
                <h3 style={{ margin: '0 0 8px 0', color: '#ff9800' }}>Avg Ticket Price</h3>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
                  {overallStats.averageTicketPriceFormatted}
                </p>
              </div>

              <div
                style={{
                  backgroundColor: 'white',
                  padding: '24px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  borderLeft: '4px solid #9c27b0',
                }}
              >
                <h3 style={{ margin: '0 0 8px 0', color: '#9c27b0' }}>Total Bookings</h3>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
                  {overallStats.totalBookings?.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Quick Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div
                style={{
                  backgroundColor: 'white',
                  padding: '24px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                <h3 style={{ margin: '0 0 16px 0' }}>Revenue by Genre</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={genreData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ genre, revenue }) => `${genre}: ${formatCurrency(revenue)}`}
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

              <div
                style={{
                  backgroundColor: 'white',
                  padding: '24px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              >
                <h3 style={{ margin: '0 0 16px 0' }}>Monthly Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="monthName" />
                    <YAxis tickFormatter={formatCurrency} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#1976d2"
                      strokeWidth={3}
                      dot={{ fill: '#1976d2', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Tab */}
        {activeTab === 'monthly' && (
          <div
            style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '0 0 8px 8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <h3 style={{ margin: '0 0 16px 0' }}>Monthly Revenue Breakdown</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="monthName" />
                <YAxis tickFormatter={formatCurrency} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="revenue" fill="#1976d2" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Movies Tab */}
        {activeTab === 'movies' && (
          <div
            style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '0 0 8px 8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <h3 style={{ margin: '0 0 16px 0' }}>Top 10 Movies by Revenue</h3>
            <ResponsiveContainer width="100%" height={500}>
              <BarChart data={movieData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={formatCurrency} />
                <YAxis dataKey="title" type="category" width={150} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="revenue" fill="#4caf50" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>

            <div style={{ marginTop: '24px' }}>
              <h4 style={{ margin: '0 0 4px 0' }}>Detailed Movie Statistics</h4>
              <p style={{ fontSize: '14px', color: '#666', margin: '0 0 16px 0' }}>
                Click on any movie to view showtime-level details
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>
                        Movie
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>
                        Genre
                      </th>
                      <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd' }}>
                        Revenue
                      </th>
                      <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd' }}>
                        Tickets Sold
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {movieData.map((movie, index) => (
                      <tr
                        key={index}
                        onClick={() => handleMovieClick(movie)}
                        style={{
                          cursor: 'pointer',
                          transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                      >
                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>{movie.title}</td>
                        <td style={{ padding: '12px', border: '1px solid #ddd' }}>{movie.genre}</td>
                        <td
                          style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd' }}
                        >
                          {movie.revenueFormatted}
                        </td>
                        <td
                          style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd' }}
                        >
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

        {/* Genres Tab */}
        {activeTab === 'genres' && (
          <div
            style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '0 0 8px 8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <h3 style={{ margin: '0 0 16px 0' }}>Revenue by Genre</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
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
                  <Legend />
                </PieChart>
              </ResponsiveContainer>

              <div>
                <h4>Genre Breakdown</h4>
                {genreData.map((genre, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      marginBottom: '8px',
                      backgroundColor: '#f9f9f9',
                      borderRadius: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          backgroundColor: COLORS[index % COLORS.length],
                          borderRadius: '50%',
                        }}
                      ></div>
                      <span style={{ fontWeight: 'bold' }}>{genre.genre}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold' }}>{genre.revenueFormatted}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
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
