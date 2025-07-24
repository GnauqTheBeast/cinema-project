import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { movieService } from '../../services/movieApi';
import MovieCard from '../../components/admin/MovieCard';
import AdminLayout from '../../components/admin/AdminLayout';

export default function MoviesPage() {
  const [movies, setMovies] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();

  const fetchMovies = useCallback(async (page = 1, size = 12, search = '') => {
    try {
      setLoading(page === 1);
      if (search) setSearching(true);
      
      const data = await movieService.getMovies(page, size, search);
      setMovies(data.data?.movies || []);
      setMeta(data.data?.meta || {});
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load movies');
      console.error('Error fetching movies:', err);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMovies(1, 12, searchQuery);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value === '') {
      fetchMovies(1, 12, '');
    }
  };

  const handlePageChange = (newPage) => {
    fetchMovies(newPage, meta.size, searchQuery);
    window.scrollTo(0, 0);
  };

  const clearSearch = () => {
    setSearchQuery('');
    fetchMovies(1, 12, '');
  };

  if (loading && !searching) {
    return (
      <AdminLayout>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div>Loading movies...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        {/* Page Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px' 
        }}>
          <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
            Movies Management
          </h2>
          <button
            onClick={() => navigate('/admin/movies/new')}
            style={{
              background: '#4caf50',
              border: 'none',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            ➕ Add New Movie
          </button>
        </div>

        {/* Search Bar */}
        <div style={{
          backgroundColor: 'white',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search movies by title..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  paddingRight: searchQuery ? '40px' : '16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    fontSize: '18px',
                    cursor: 'pointer',
                    color: '#999',
                    padding: '4px'
                  }}
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={searching}
              style={{
                padding: '12px 24px',
                backgroundColor: searching ? '#ccc' : '#1976d2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: searching ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                minWidth: '100px'
              }}
            >
              {searching ? '🔍...' : '🔍 Search'}
            </button>
          </form>
          
          {searchQuery && (
            <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
              {searching ? 'Searching...' : `Showing results for "${searchQuery}"`}
              {meta.total !== undefined && ` (${meta.total} movies found)`}
            </div>
          )}
        </div>

        {error && (
          <div style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '24px'
          }}>
            {error}
          </div>
        )}

        {/* Movies Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          {movies.map(movie => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>

        {movies.length === 0 && !loading && !searching && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            backgroundColor: 'white',
            borderRadius: '8px'
          }}>
            <h3>{searchQuery ? 'No movies found' : 'No movies available'}</h3>
            <p>
              {searchQuery 
                ? `No movies match "${searchQuery}". Try a different search term.`
                : 'Be the first to add a movie!'
              }
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate('/admin/movies/new')}
                style={{
                  background: '#1976d2',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Add First Movie
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {meta.total_pages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginTop: '32px',
            backgroundColor: 'white',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <button
              onClick={() => handlePageChange(meta.page - 1)}
              disabled={meta.page <= 1}
              style={{
                padding: '8px 16px',
                border: '1px solid #ddd',
                backgroundColor: meta.page <= 1 ? '#f5f5f5' : 'white',
                color: meta.page <= 1 ? '#999' : '#333',
                cursor: meta.page <= 1 ? 'not-allowed' : 'pointer',
                borderRadius: '4px'
              }}
            >
              ← Previous
            </button>

            <span style={{ padding: '8px 16px', color: '#666' }}>
              Page {meta.page} of {meta.total_pages} ({meta.total} total movies)
            </span>

            <button
              onClick={() => handlePageChange(meta.page + 1)}
              disabled={meta.page >= meta.total_pages}
              style={{
                padding: '8px 16px',
                border: '1px solid #ddd',
                backgroundColor: meta.page >= meta.total_pages ? '#f5f5f5' : 'white',
                color: meta.page >= meta.total_pages ? '#999' : '#333',
                cursor: meta.page >= meta.total_pages ? 'not-allowed' : 'pointer',
                borderRadius: '4px'
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
} 