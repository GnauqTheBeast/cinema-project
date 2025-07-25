import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { movieService } from '../../services/movieApi';
import AdminLayout from '../../components/admin/AdminLayout';

export default function MovieDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchMovie();
  }, [id]);

  const fetchMovie = async () => {
    try {
      setLoading(true);
      const data = await movieService.getMovieById(id);
      setMovie(data.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load movie');
      console.error('Error fetching movie:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdating(true);
      await movieService.updateMovieStatus(id, newStatus);
      setMovie({ ...movie, status: newStatus });
    } catch (err) {
      alert('Failed to update movie status: ' + (err.response?.data?.message || err.message));
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this movie?')) return;

    try {
      await movieService.deleteMovie(id);
      navigate('/admin/movies');
    } catch (err) {
      alert('Failed to delete movie: ' + (err.response?.data?.message || err.message));
    }
  };

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
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div>Loading movie...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !movie) {
    return (
      <AdminLayout>
        <div>
          <div style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '16px',
            borderRadius: '4px',
            marginBottom: '24px'
          }}>
            {error || 'Movie not found'}
          </div>
          <button
            onClick={() => navigate('/admin/movies')}
            style={{
              background: '#1976d2',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Back to Movies
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        {/* Navigation */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => navigate('/admin/movies')}
            style={{
              background: 'none',
              border: '1px solid #ddd',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '16px'
            }}
          >
            ← Back to Movies
          </button>
          <button
            onClick={() => navigate(`/admin/movies/${id}/edit`)}
            style={{
              background: '#ff9800',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '16px'
            }}
          >
            Edit Movie
          </button>
          <button
            onClick={handleDelete}
            style={{
              background: '#f44336',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Delete Movie
          </button>
        </div>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '32px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
            {/* Poster */}
            {movie.poster_url && (
              <div style={{ flex: '0 0 300px' }}>
                <img
                  src={movie.poster_url}
                  alt={movie.title}
                  style={{
                    width: '100%',
                    height: 'auto',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                  }}
                />
              </div>
            )}

            {/* Details */}
            <div style={{ flex: '1', minWidth: '300px' }}>
              <h1 style={{ margin: '0 0 16px 0', fontSize: '32px', fontWeight: 'bold' }}>
                {movie.title}
              </h1>

              {/* Status */}
              <div style={{ marginBottom: '24px' }}>
                <span
                  style={{
                    backgroundColor: getStatusColor(movie.status),
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '16px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}
                >
                  {movie.status?.replace('_', ' ')}
                </span>
              </div>

              {/* Basic Info */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <strong>Director:</strong> {movie.director || 'Unknown'}
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong>Cast:</strong> {movie.cast || 'Unknown'}
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong>Genre:</strong> {movie.genre || 'Unknown'}
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong>Duration:</strong> {formatDuration(movie.duration)}
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <strong>Release Date:</strong> {formatDate(movie.release_date)}
                </div>
              </div>

              {/* Status Update */}
              <div style={{ marginBottom: '24px' }}>
                <strong>Update Status:</strong>
                <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['upcoming', 'showing', 'ended'].map(status => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      disabled={updating || movie.status === status}
                      style={{
                        backgroundColor: movie.status === status ? getStatusColor(status) : 'white',
                        color: movie.status === status ? 'white' : '#333',
                        border: `2px solid ${getStatusColor(status)}`,
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: updating || movie.status === status ? 'not-allowed' : 'pointer',
                        opacity: updating || movie.status === status ? 0.6 : 1,
                        textTransform: 'capitalize'
                      }}
                    >
                      {status.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {movie.description && (
            <div style={{ marginTop: '32px' }}>
              <h3 style={{ marginBottom: '12px' }}>Description</h3>
              <p style={{ lineHeight: '1.6', color: '#666' }}>
                {movie.description}
              </p>
            </div>
          )}

          {/* Trailer */}
          {movie.trailer_url && (
            <div style={{ marginTop: '32px' }}>
              <h3 style={{ marginBottom: '12px' }}>Trailer</h3>
              <a
                href={movie.trailer_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#1976d2',
                  textDecoration: 'none',
                  fontSize: '16px'
                }}
              >
                🎬 Watch Trailer
              </a>
            </div>
          )}

          {/* Timestamps */}
          <div style={{
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '1px solid #eee',
            fontSize: '14px',
            color: '#999'
          }}>
            <div>Created: {formatDate(movie.created_at)}</div>
            {movie.updated_at && movie.updated_at !== movie.created_at && (
              <div>Updated: {formatDate(movie.updated_at)}</div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 