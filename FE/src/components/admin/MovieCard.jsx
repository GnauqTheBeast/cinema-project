import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function MovieCard({ movie }) {
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return '#ff9800';
      case 'showing': return '#4caf50';
      case 'ended': return '#f44336';
      default: return '#757575';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBA';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div 
      className="movie-card"
      onClick={() => navigate(`/admin/movies/${movie.id}`)}
      style={{
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '16px',
        margin: '8px',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        backgroundColor: '#fff',
        minHeight: '200px'
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'translateY(-2px)';
        e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = 'none';
      }}
    >
      {movie.poster_url && (
        <img 
          src={movie.poster_url} 
          alt={movie.title}
          style={{
            width: '100%',
            height: '150px',
            objectFit: 'cover',
            borderRadius: '4px',
            marginBottom: '12px'
          }}
        />
      )}
      
      <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 'bold' }}>
        {movie.title}
      </h3>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <span 
          style={{
            backgroundColor: getStatusColor(movie.status),
            color: 'white',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 'bold',
            textTransform: 'uppercase'
          }}
        >
          {movie.status?.replace('_', ' ')}
        </span>
      </div>

      <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
        <strong>Director:</strong> {movie.director || 'Unknown'}
      </div>
      
      <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
        <strong>Genre:</strong> {movie.genre || 'Unknown'}
      </div>
      
      <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
        <strong>Duration:</strong> {formatDuration(movie.duration)}
      </div>
      
      <div style={{ fontSize: '14px', color: '#666' }}>
        <strong>Release:</strong> {formatDate(movie.release_date)}
      </div>
    </div>
  );
} 