export default function MetricCard({ title, value, change, icon, gradient, formatValue = (v) => v }) {
  const isPositive = change >= 0
  const changeColor = isPositive ? '#4caf50' : '#f44336'
  const arrow = isPositive ? '↑' : '↓'

  return (
    <div
      style={{
        background: gradient,
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        color: 'white',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)'
        e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <span style={{ fontSize: '14px', opacity: 0.9 }}>{title}</span>
        <span style={{ fontSize: '24px' }}>{icon}</span>
      </div>

      <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
        {formatValue(value)}
      </div>

      <div
        style={{
          fontSize: '16px',
          fontWeight: 600,
          color: changeColor,
          backgroundColor: 'rgba(255,255,255,0.2)',
          padding: '4px 8px',
          borderRadius: '4px',
          display: 'inline-block',
        }}
      >
        {arrow} {Math.abs(change).toFixed(1)}% vs last week
      </div>
    </div>
  )
}
