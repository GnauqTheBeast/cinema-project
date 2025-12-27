import { useEffect, useState } from 'react'

export default function ShowtimeRevenueModal({
  movie,
  showtimes,
  dateRange,
  onClose,
  formatCurrency,
  loading,
}) {
  const [sortedShowtimes, setSortedShowtimes] = useState([])

  useEffect(() => {
    if (showtimes && showtimes.length > 0) {
      const sorted = [...showtimes].sort((a, b) => b.total_revenue - a.total_revenue)
      setSortedShowtimes(sorted)
    } else {
      setSortedShowtimes([])
    }
  }, [showtimes])

  const summaryStats = {
    totalRevenue: sortedShowtimes.reduce((sum, st) => sum + st.total_revenue, 0),
    totalTickets: sortedShowtimes.reduce((sum, st) => sum + st.total_tickets, 0),
    totalShowtimes: sortedShowtimes.length,
    avgOccupancy:
      sortedShowtimes.length > 0
        ? sortedShowtimes.reduce((sum, st) => sum + st.occupancy_rate, 0) / sortedShowtimes.length
        : 0,
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('vi-VN')
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          maxWidth: '1200px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
      >
        <div
          style={{
            position: 'sticky',
            top: 0,
            backgroundColor: 'white',
            borderBottom: '1px solid #e0e0e0',
            padding: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
              {movie.title} - Showtime Analytics
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>
              {formatDate(dateRange.startDate)} - {formatDate(dateRange.endDate)}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '32px',
              cursor: 'pointer',
              color: '#666',
              lineHeight: 1,
              padding: '0',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div
                style={{
                  border: '4px solid #f3f3f3',
                  borderTop: '4px solid #1976d2',
                  borderRadius: '50%',
                  width: '48px',
                  height: '48px',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto',
                }}
              ></div>
              <style>
                {`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}
              </style>
              <p style={{ marginTop: '16px', color: '#666' }}>Loading showtime analytics...</p>
            </div>
          ) : sortedShowtimes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p>No showtime data available for this movie in the selected date range</p>
            </div>
          ) : (
            <>
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
                  <h3 style={{ margin: '0 0 8px 0', color: '#4caf50', fontSize: '14px' }}>
                    Total Revenue
                  </h3>
                  <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
                    {formatCurrency(summaryStats.totalRevenue)}
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
                  <h3 style={{ margin: '0 0 8px 0', color: '#2196f3', fontSize: '14px' }}>
                    Total Tickets
                  </h3>
                  <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
                    {summaryStats.totalTickets.toLocaleString()}
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
                  <h3 style={{ margin: '0 0 8px 0', color: '#9c27b0', fontSize: '14px' }}>
                    Total Showtimes
                  </h3>
                  <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
                    {summaryStats.totalShowtimes}
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
                  <h3 style={{ margin: '0 0 8px 0', color: '#ff9800', fontSize: '14px' }}>
                    Avg Occupancy
                  </h3>
                  <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
                    {summaryStats.avgOccupancy.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                }}
              >
                <h3 style={{ margin: 0, padding: '20px 24px', borderBottom: '1px solid #e0e0e0' }}>
                  Showtime Details
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f5f5f5' }}>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            borderBottom: '2px solid #ddd',
                            fontWeight: 'bold',
                            fontSize: '14px',
                          }}
                        >
                          Date
                        </th>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            borderBottom: '2px solid #ddd',
                            fontWeight: 'bold',
                            fontSize: '14px',
                          }}
                        >
                          Time
                        </th>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            borderBottom: '2px solid #ddd',
                            fontWeight: 'bold',
                            fontSize: '14px',
                          }}
                        >
                          Room
                        </th>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: 'right',
                            borderBottom: '2px solid #ddd',
                            fontWeight: 'bold',
                            fontSize: '14px',
                          }}
                        >
                          Revenue
                        </th>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: 'right',
                            borderBottom: '2px solid #ddd',
                            fontWeight: 'bold',
                            fontSize: '14px',
                          }}
                        >
                          Tickets
                        </th>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: 'right',
                            borderBottom: '2px solid #ddd',
                            fontWeight: 'bold',
                            fontSize: '14px',
                          }}
                        >
                          Occupancy
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedShowtimes.map((showtime, index) => (
                        <tr
                          key={showtime.showtime_id}
                          style={{
                            backgroundColor: index % 2 === 0 ? 'white' : '#fafafa',
                            transition: 'background-color 0.2s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor =
                              index % 2 === 0 ? 'white' : '#fafafa')
                          }
                        >
                          <td
                            style={{
                              padding: '12px 16px',
                              borderBottom: '1px solid #e0e0e0',
                              fontSize: '14px',
                            }}
                          >
                            {formatDate(showtime.showtime_date)}
                          </td>
                          <td
                            style={{
                              padding: '12px 16px',
                              borderBottom: '1px solid #e0e0e0',
                              fontSize: '14px',
                            }}
                          >
                            {showtime.showtime_time}
                          </td>
                          <td
                            style={{
                              padding: '12px 16px',
                              borderBottom: '1px solid #e0e0e0',
                              fontSize: '14px',
                            }}
                          >
                            {showtime.room_number}
                          </td>
                          <td
                            style={{
                              padding: '12px 16px',
                              textAlign: 'right',
                              borderBottom: '1px solid #e0e0e0',
                              fontSize: '14px',
                              fontWeight: '600',
                            }}
                          >
                            {formatCurrency(showtime.total_revenue)}
                          </td>
                          <td
                            style={{
                              padding: '12px 16px',
                              textAlign: 'right',
                              borderBottom: '1px solid #e0e0e0',
                              fontSize: '14px',
                            }}
                          >
                            {showtime.total_tickets.toLocaleString()}
                          </td>
                          <td
                            style={{
                              padding: '12px 16px',
                              textAlign: 'right',
                              borderBottom: '1px solid #e0e0e0',
                              fontSize: '14px',
                            }}
                          >
                            <span
                              style={{
                                backgroundColor:
                                  showtime.occupancy_rate >= 80
                                    ? '#e8f5e9'
                                    : showtime.occupancy_rate >= 50
                                      ? '#fff3e0'
                                      : '#ffebee',
                                color:
                                  showtime.occupancy_rate >= 80
                                    ? '#2e7d32'
                                    : showtime.occupancy_rate >= 50
                                      ? '#e65100'
                                      : '#c62828',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontWeight: '600',
                              }}
                            >
                              {showtime.occupancy_rate.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
