export default function MovieStatsGrid({ stats, loading }) {
  const statsData = [
    {
      label: 'Total Movies',
      value: stats.total,
      color: '#1976d2',
      bg: '#e3f2fd',
    },
    {
      label: 'Now Showing',
      value: stats.by_status?.showing || 0,
      color: '#4caf50',
      bg: '#e8f5e9',
    },
    {
      label: 'Upcoming',
      value: stats.by_status?.upcoming || 0,
      color: '#ff9800',
      bg: '#fff3e0',
    },
    {
      label: 'Ended',
      value: stats.by_status?.ended || 0,
      color: '#f44336',
      bg: '#ffebee',
    },
  ]

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
        📽️ Movie Statistics
      </h3>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {statsData.map((stat, idx) => (
            <div
              key={idx}
              style={{
                padding: '16px',
                backgroundColor: stat.bg,
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: stat.color }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
