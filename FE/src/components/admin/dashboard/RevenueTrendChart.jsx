import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '../../../utils/formatters'

export default function RevenueTrendChart({ data, loading }) {
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: 'white',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <p style={{ margin: '0 0 4px 0', fontWeight: 'bold' }}>{payload[0].payload.day}</p>
          <p style={{ margin: 0, color: '#4caf50', fontSize: '16px', fontWeight: 'bold' }}>
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          height: '350px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ textAlign: 'center', color: '#666' }}>Loading chart...</div>
      </div>
    )
  }

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        marginBottom: '24px',
      }}
    >
      <h3
        style={{
          margin: '0 0 20px 0',
          fontSize: '20px',
          fontWeight: 'bold',
        }}
      >
        💹 Revenue Trend - Last 7 Days
      </h3>

      {data.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
          No revenue data available for this week
        </p>
      ) : (
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis dataKey="day" stroke="#666" style={{ fontSize: '12px' }} />
            <YAxis
              tickFormatter={(value) => formatCurrency(value)}
              stroke="#666"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#4caf50"
              strokeWidth={3}
              dot={{ fill: '#4caf50', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
