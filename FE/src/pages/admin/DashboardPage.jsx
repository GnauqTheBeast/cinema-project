import { useEffect, useState } from 'react'
import AdminLayout from '../../components/admin/AdminLayout'
import { movieService } from '../../services/movieApi'
import analyticsService from '../../services/analyticsService'
import { formatCurrency } from '../../utils/formatters'
import { getWeekRange, getPreviousWeekRange, getWeekDisplayString, getDayName } from '../../utils/dateUtils'
import MetricCard from '../../components/admin/dashboard/MetricCard'
import MetricCardSkeleton from '../../components/admin/dashboard/MetricCardSkeleton'
import RevenueTrendChart from '../../components/admin/dashboard/RevenueTrendChart'
import TopMoviesList from '../../components/admin/dashboard/TopMoviesList'
import MovieStatsGrid from '../../components/admin/dashboard/MovieStatsGrid'
import QuickActionsSection from '../../components/admin/dashboard/QuickActionsSection'

export default function DashboardPage() {
  const user = JSON.parse(localStorage.getItem('adminUser'))

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [metrics, setMetrics] = useState({
    revenue: 0,
    tickets: 0,
    bookings: 0,
    avgPrice: 0,
    prevRevenue: 0,
    prevTickets: 0,
    prevBookings: 0,
    prevAvgPrice: 0,
    revenueChange: 0,
    ticketsChange: 0,
    bookingsChange: 0,
    avgPriceChange: 0,
  })

  const [topMovies, setTopMovies] = useState([])
  const [dailyData, setDailyData] = useState([])
  const [movieStats, setMovieStats] = useState({
    total: 0,
    by_status: { showing: 0, upcoming: 0, ended: 0 },
  })

  const [weekRange, setWeekRange] = useState({ startDate: '', endDate: '' })

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const thisWeek = getWeekRange()
      const prevWeek = getPreviousWeekRange()

      setWeekRange(thisWeek)

      const [thisWeekMovies, prevWeekMovies, dailyRevenue, movieStatsData] = await Promise.all([
        analyticsService.getRevenueByMovie(thisWeek.startDate, thisWeek.endDate, 100),
        analyticsService.getRevenueByMovie(prevWeek.startDate, prevWeek.endDate, 100),
        analyticsService.getRevenueByTime(thisWeek.startDate, thisWeek.endDate, 7),
        movieService.getMovieStats(),
      ])

      processMetrics(thisWeekMovies, prevWeekMovies, dailyRevenue, movieStatsData)
    } catch (err) {
      console.error('Error fetching dashboard data:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const processMetrics = (thisWeekMovies, prevWeekMovies, dailyRevenue, movieStatsData) => {
    const thisWeekData =
      thisWeekMovies.success && thisWeekMovies.data
        ? thisWeekMovies.data.reduce(
            (acc, m) => ({
              revenue: acc.revenue + m.total_revenue,
              tickets: acc.tickets + m.total_tickets,
              bookings: acc.bookings + m.total_bookings,
            }),
            { revenue: 0, tickets: 0, bookings: 0 }
          )
        : { revenue: 0, tickets: 0, bookings: 0 }

    const prevWeekData =
      prevWeekMovies.success && prevWeekMovies.data
        ? prevWeekMovies.data.reduce(
            (acc, m) => ({
              revenue: acc.revenue + m.total_revenue,
              tickets: acc.tickets + m.total_tickets,
              bookings: acc.bookings + m.total_bookings,
            }),
            { revenue: 0, tickets: 0, bookings: 0 }
          )
        : { revenue: 0, tickets: 0, bookings: 0 }

    const avgPrice = thisWeekData.tickets > 0 ? thisWeekData.revenue / thisWeekData.tickets : 0
    const prevAvgPrice = prevWeekData.tickets > 0 ? prevWeekData.revenue / prevWeekData.tickets : 0

    setMetrics({
      revenue: thisWeekData.revenue,
      tickets: thisWeekData.tickets,
      bookings: thisWeekData.bookings,
      avgPrice,
      prevRevenue: prevWeekData.revenue,
      prevTickets: prevWeekData.tickets,
      prevBookings: prevWeekData.bookings,
      prevAvgPrice,
      revenueChange: calculateChange(thisWeekData.revenue, prevWeekData.revenue),
      ticketsChange: calculateChange(thisWeekData.tickets, prevWeekData.tickets),
      bookingsChange: calculateChange(thisWeekData.bookings, prevWeekData.bookings),
      avgPriceChange: calculateChange(avgPrice, prevAvgPrice),
    })

    if (thisWeekMovies.success && thisWeekMovies.data) {
      setTopMovies(thisWeekMovies.data.slice(0, 5))
    }

    if (dailyRevenue.success && dailyRevenue.data) {
      const chartData = dailyRevenue.data.map((item) => ({
        day: getDayName(item.time_period),
        date: item.time_period,
        revenue: item.total_revenue,
      }))
      setDailyData(chartData)
    }

    if (movieStatsData.data) {
      setMovieStats(movieStatsData.data)
    }
  }

  const gradients = {
    revenue: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
    tickets: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
    bookings: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 100%)',
    avgPrice: 'linear-gradient(135deg, #ff9800 0%, #ffa726 100%)',
  }

  if (!user) return null

  return (
    <AdminLayout>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '20px 24px',
            marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '24px', fontWeight: 'bold' }}>
              Welcome back, {user.fullName?.firstName || user.email}!
            </h2>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
              📅{' '}
              {weekRange.startDate
                ? getWeekDisplayString(weekRange.startDate, weekRange.endDate)
                : 'Loading...'}
            </p>
          </div>
          {!loading && (
            <div style={{ textAlign: 'right', color: '#666', fontSize: '14px' }}>
              <div>Email: {user.email}</div>
              {user.fullName && (
                <div>
                  {user.fullName.firstName} {user.fullName.lastName}
                </div>
              )}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          {loading ? (
            <>
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
              <MetricCardSkeleton />
            </>
          ) : (
            <>
              <MetricCard
                title="Total Revenue"
                value={metrics.revenue}
                change={metrics.revenueChange}
                icon="💰"
                gradient={gradients.revenue}
                formatValue={formatCurrency}
              />
              <MetricCard
                title="Tickets Sold"
                value={metrics.tickets}
                change={metrics.ticketsChange}
                icon="🎫"
                gradient={gradients.tickets}
                formatValue={(v) => v.toLocaleString()}
              />
              <MetricCard
                title="Total Bookings"
                value={metrics.bookings}
                change={metrics.bookingsChange}
                icon="📊"
                gradient={gradients.bookings}
                formatValue={(v) => v.toLocaleString()}
              />
              <MetricCard
                title="Avg Ticket Price"
                value={metrics.avgPrice}
                change={metrics.avgPriceChange}
                icon="📈"
                gradient={gradients.avgPrice}
                formatValue={formatCurrency}
              />
            </>
          )}
        </div>

        <RevenueTrendChart data={dailyData} loading={loading} />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1.5fr 1fr',
            gap: '24px',
            marginBottom: '24px',
          }}
        >
          <TopMoviesList movies={topMovies} loading={loading} />
          <MovieStatsGrid stats={movieStats} loading={loading} />
        </div>

        <QuickActionsSection />
      </div>

      <style>
        {`
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}
      </style>
    </AdminLayout>
  )
}
