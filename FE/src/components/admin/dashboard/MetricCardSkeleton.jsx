export default function MetricCardSkeleton() {
  return (
    <div
      style={{
        background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        borderRadius: '12px',
        padding: '24px',
        height: '140px',
      }}
    >
      <div
        style={{
          height: '20px',
          width: '60%',
          background: '#e0e0e0',
          borderRadius: '4px',
          marginBottom: '12px',
        }}
      />
      <div
        style={{
          height: '40px',
          width: '80%',
          background: '#e0e0e0',
          borderRadius: '4px',
          marginBottom: '8px',
        }}
      />
      <div
        style={{
          height: '24px',
          width: '50%',
          background: '#e0e0e0',
          borderRadius: '4px',
        }}
      />
    </div>
  )
}
