import { useNavigate } from 'react-router-dom'

export default function QuickActionsSection() {
  const navigate = useNavigate()

  const actions = [
    {
      label: 'View All Movies',
      path: '/admin/movies',
      icon: '🎬',
      gradient: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
    },
    {
      label: 'Add New Movie',
      path: '/admin/movies/new',
      icon: '➕',
      gradient: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
    },
    {
      label: 'Revenue Analytics',
      path: '/admin/revenue',
      icon: '💰',
      gradient: 'linear-gradient(135deg, #ff9800 0%, #ffa726 100%)',
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
        ⚡ Quick Actions
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
        }}
      >
        {actions.map((action) => (
          <button
            key={action.path}
            onClick={() => navigate(action.path)}
            style={{
              background: action.gradient,
              color: 'white',
              border: 'none',
              padding: '20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <span style={{ fontSize: '24px' }}>{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
