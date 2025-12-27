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

const COLORS = ['#EF4444', '#F97316', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899']

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
            backgroundColor: '#FFFFFF',
            padding: '12px',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
            fontFamily: "'Open Sans', sans-serif",
          }}
        >
          <p style={{ margin: '0 0 8px 0', fontWeight: 600, color: '#111827', fontSize: '13px' }}>
            {label}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ margin: '0', color: entry.color, fontSize: '13px' }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'monthly', label: 'Monthly' },
    { id: 'movies', label: 'By Movies' },
    { id: 'genres', label: 'By Genres' },
  ]

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '64px 24px' }}>
          <div
            style={{
              border: '3px solid #F3F4F6',
              borderTop: '3px solid #EF4444',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              animation: 'spin 800ms linear infinite',
              margin: '0 auto',
            }}
          ></div>
          <p
            style={{
              marginTop: '16px',
              color: '#6B7280',
              fontFamily: "'Open Sans', sans-serif",
            }}
          >
            Loading revenue statistics...
          </p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div>
        <div style={{ marginBottom: '32px' }}>
          <h2
            style={{
              margin: '0 0 8px 0',
              fontSize: '32px',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: '#111827',
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            Revenue Statistics
          </h2>
          <p
            style={{
              margin: 0,
              color: '#6B7280',
              fontSize: '14px',
              fontFamily: "'Open Sans', sans-serif",
            }}
          >
            Comprehensive revenue analysis and insights
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '24px',
            backgroundColor: '#FFFFFF',
            padding: '8px',
            borderRadius: '12px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.08)',
          }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '12px 24px',
                border: 'none',
                background: activeTab === tab.id ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' : 'transparent',
                color: activeTab === tab.id ? '#FFFFFF' : '#6B7280',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? 600 : 500,
                transition: 'all 150ms ease-in-out',
                fontFamily: "'Open Sans', sans-serif",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.backgroundColor = '#F9FAFB'
                  e.currentTarget.style.color = '#111827'
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#6B7280'
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div>
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
                  backgroundColor: '#FFFFFF',
                  padding: '24px',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 1px 3px 0 rgba(0,0,0,0.08)',
                }}
              >
                <h3
                  style={{
                    margin: '0 0 8px 0',
                    color: '#6B7280',
                    fontSize: '13px',
                    fontWeight: 600,
                    letterSpacing: '0.025em',
                    textTransform: 'uppercase',
                    fontFamily: "'Open Sans', sans-serif",
                  }}
                >
                  Total Revenue
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: '28px',
                    fontWeight: 700,
                    color: '#111827',
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  {overallStats.totalRevenueFormatted}
                </p>
              </div>

              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: '24px',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 1px 3px 0 rgba(0,0,0,0.08)',
                }}
              >
                <h3
                  style={{
                    margin: '0 0 8px 0',
                    color: '#6B7280',
                    fontSize: '13px',
                    fontWeight: 600,
                    letterSpacing: '0.025em',
                    textTransform: 'uppercase',
                    fontFamily: "'Open Sans', sans-serif",
                  }}
                >
                  Total Tickets
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: '28px',
                    fontWeight: 700,
                    color: '#111827',
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  {overallStats.totalTickets?.toLocaleString()}
                </p>
              </div>

              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: '24px',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 1px 3px 0 rgba(0,0,0,0.08)',
                }}
              >
                <h3
                  style={{
                    margin: '0 0 8px 0',
                    color: '#6B7280',
                    fontSize: '13px',
                    fontWeight: 600,
                    letterSpacing: '0.025em',
                    textTransform: 'uppercase',
                    fontFamily: "'Open Sans', sans-serif",
                  }}
                >
                  Avg Ticket Price
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: '28px',
                    fontWeight: 700,
                    color: '#111827',
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  {overallStats.averageTicketPriceFormatted}
                </p>
              </div>

              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: '24px',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 1px 3px 0 rgba(0,0,0,0.08)',
                }}
              >
                <h3
                  style={{
                    margin: '0 0 8px 0',
                    color: '#6B7280',
                    fontSize: '13px',
                    fontWeight: 600,
                    letterSpacing: '0.025em',
                    textTransform: 'uppercase',
                    fontFamily: "'Open Sans', sans-serif",
                  }}
                >
                  Total Bookings
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: '28px',
                    fontWeight: 700,
                    color: '#111827',
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  {overallStats.totalBookings?.toLocaleString()}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: '24px',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 1px 3px 0 rgba(0,0,0,0.08)',
                }}
              >
                <h3
                  style={{
                    margin: '0 0 16px 0',
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#111827',
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  Revenue by Genre
                </h3>
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

              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  padding: '24px',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 1px 3px 0 rgba(0,0,0,0.08)',
                }}
              >
                <h3
                  style={{
                    margin: '0 0 16px 0',
                    fontSize: '18px',
                    fontWeight: 600,
                    color: '#111827',
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  Monthly Trend
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis
                      dataKey="monthName"
                      tick={{ fontFamily: "'Open Sans', sans-serif", fontSize: 12, fill: '#6B7280' }}
                      stroke="#E5E7EB"
                    />
                    <YAxis
                      tickFormatter={formatCurrency}
                      tick={{ fontFamily: "'Open Sans', sans-serif", fontSize: 12, fill: '#6B7280' }}
                      stroke="#E5E7EB"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#EF4444"
                      strokeWidth={3}
                      dot={{ fill: '#FFFFFF', stroke: '#EF4444', strokeWidth: 2, r: 5 }}
                      name="Revenue"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'monthly' && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px 0 rgba(0,0,0,0.08)',
            }}
          >
            <h3
              style={{
                margin: '0 0 16px 0',
                fontSize: '18px',
                fontWeight: 600,
                color: '#111827',
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              Monthly Revenue Breakdown
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis
                  dataKey="monthName"
                  tick={{ fontFamily: "'Open Sans', sans-serif", fontSize: 12, fill: '#6B7280' }}
                  stroke="#E5E7EB"
                />
                <YAxis
                  tickFormatter={formatCurrency}
                  tick={{ fontFamily: "'Open Sans', sans-serif", fontSize: 12, fill: '#6B7280' }}
                  stroke="#E5E7EB"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontFamily: "'Open Sans', sans-serif", fontSize: 14 }} />
                <Bar dataKey="revenue" fill="#EF4444" name="Revenue" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === 'movies' && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px 0 rgba(0,0,0,0.08)',
            }}
          >
            <h3
              style={{
                margin: '0 0 16px 0',
                fontSize: '18px',
                fontWeight: 600,
                color: '#111827',
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              Top 10 Movies by Revenue
            </h3>
            <ResponsiveContainer width="100%" height={500}>
              <BarChart data={movieData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis
                  type="number"
                  tickFormatter={formatCurrency}
                  tick={{ fontFamily: "'Open Sans', sans-serif", fontSize: 12, fill: '#6B7280' }}
                  stroke="#E5E7EB"
                />
                <YAxis
                  dataKey="title"
                  type="category"
                  width={150}
                  tick={{ fontFamily: "'Open Sans', sans-serif", fontSize: 12, fill: '#6B7280' }}
                  stroke="#E5E7EB"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontFamily: "'Open Sans', sans-serif", fontSize: 14 }} />
                <Bar dataKey="revenue" fill="#EF4444" name="Revenue" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>

            <div style={{ marginTop: '32px' }}>
              <h4
                style={{
                  margin: '0 0 4px 0',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#111827',
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                Detailed Movie Statistics
              </h4>
              <p
                style={{
                  fontSize: '14px',
                  color: '#6B7280',
                  margin: '0 0 16px 0',
                  fontFamily: "'Open Sans', sans-serif",
                }}
              >
                Click on any movie to view showtime-level details
              </p>
              <div
                style={{
                  overflowX: 'auto',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#F9FAFB' }}>
                      <th
                        style={{
                          padding: '16px',
                          textAlign: 'left',
                          borderBottom: '1px solid #E5E7EB',
                          fontFamily: "'Open Sans', sans-serif",
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#6B7280',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Movie
                      </th>
                      <th
                        style={{
                          padding: '16px',
                          textAlign: 'left',
                          borderBottom: '1px solid #E5E7EB',
                          fontFamily: "'Open Sans', sans-serif",
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#6B7280',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Genre
                      </th>
                      <th
                        style={{
                          padding: '16px',
                          textAlign: 'right',
                          borderBottom: '1px solid #E5E7EB',
                          fontFamily: "'Open Sans', sans-serif",
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#6B7280',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Revenue
                      </th>
                      <th
                        style={{
                          padding: '16px',
                          textAlign: 'right',
                          borderBottom: '1px solid #E5E7EB',
                          fontFamily: "'Open Sans', sans-serif",
                          fontSize: '12px',
                          fontWeight: 600,
                          color: '#6B7280',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                        }}
                      >
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
                          transition: 'background-color 150ms ease-in-out',
                          borderBottom: '1px solid #F3F4F6',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#F9FAFB')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td
                          style={{
                            padding: '16px',
                            fontFamily: "'Open Sans', sans-serif",
                            fontSize: '14px',
                            color: '#111827',
                          }}
                        >
                          {movie.title}
                        </td>
                        <td
                          style={{
                            padding: '16px',
                            fontFamily: "'Open Sans', sans-serif",
                            fontSize: '14px',
                            color: '#6B7280',
                          }}
                        >
                          {movie.genre}
                        </td>
                        <td
                          style={{
                            padding: '16px',
                            textAlign: 'right',
                            fontFamily: "'Open Sans', sans-serif",
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#111827',
                          }}
                        >
                          {movie.revenueFormatted}
                        </td>
                        <td
                          style={{
                            padding: '16px',
                            textAlign: 'right',
                            fontFamily: "'Open Sans', sans-serif",
                            fontSize: '14px',
                            color: '#111827',
                          }}
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

        {activeTab === 'genres' && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 1px 3px 0 rgba(0,0,0,0.08)',
            }}
          >
            <h3
              style={{
                margin: '0 0 16px 0',
                fontSize: '18px',
                fontWeight: 600,
                color: '#111827',
                fontFamily: "'Poppins', sans-serif",
              }}
            >
              Revenue by Genre
            </h3>
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
                  <Legend wrapperStyle={{ fontFamily: "'Open Sans', sans-serif", fontSize: 14 }} />
                </PieChart>
              </ResponsiveContainer>

              <div>
                <h4
                  style={{
                    margin: '0 0 16px 0',
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#111827',
                    fontFamily: "'Poppins', sans-serif",
                  }}
                >
                  Genre Breakdown
                </h4>
                {genreData.map((genre, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      marginBottom: '8px',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '16px',
                          height: '16px',
                          backgroundColor: COLORS[index % COLORS.length],
                          borderRadius: '4px',
                        }}
                      ></div>
                      <span
                        style={{
                          fontWeight: 600,
                          color: '#111827',
                          fontFamily: "'Open Sans', sans-serif",
                          fontSize: '14px',
                        }}
                      >
                        {genre.genre}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontWeight: 700,
                          color: '#111827',
                          fontFamily: "'Poppins', sans-serif",
                          fontSize: '16px',
                        }}
                      >
                        {genre.revenueFormatted}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#6B7280',
                          fontFamily: "'Open Sans', sans-serif",
                        }}
                      >
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
