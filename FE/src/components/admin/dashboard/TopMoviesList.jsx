import { formatCurrency } from '../../../utils/formatters'

export default function TopMoviesList({ movies, loading }) {
  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      }}
    >
      <h3
        style={{
          margin: '0 0 20px 0',
          fontSize: '20px',
          fontWeight: 'bold',
        }}
      >
        🎬 Top 5 Movies (This Week)
      </h3>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>Loading...</div>
      ) : movies.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
          No movie data available
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {movies.map((movie, index) => (
            <div
              key={movie.movie_id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                transition: 'background-color 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e8f5e9')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background:
                    index === 0
                      ? 'linear-gradient(135deg, #ffd700, #ffed4e)'
                      : index === 1
                        ? 'linear-gradient(135deg, #c0c0c0, #e8e8e8)'
                        : index === 2
                          ? 'linear-gradient(135deg, #cd7f32, #e6a35d)'
                          : 'linear-gradient(135deg, #9e9e9e, #bdbdbd)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '18px',
                  color: index < 3 ? 'white' : '#666',
                }}
              >
                {index + 1}
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontWeight: 'bold',
                    fontSize: '16px',
                    marginBottom: '4px',
                  }}
                >
                  {movie.movie_title}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {movie.total_tickets} tickets • {movie.total_bookings} bookings
                </div>
              </div>

              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#4caf50',
                }}
              >
                {formatCurrency(movie.total_revenue)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
