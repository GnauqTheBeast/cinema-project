import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { movieService } from '../../services/movieApi';
import AdminLayout from '../../components/admin/AdminLayout';

export default function DashboardPage() {
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await movieService.getMovieStats();
      setStats(data.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <AdminLayout>
      <div>
        {/* Welcome Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '24px' }}>
            Welcome back, {user.fullName?.firstName || user.email}!
          </h2>
          <div style={{ color: '#666', marginBottom: '16px' }}>
            <div><strong>Email:</strong> {user.email}</div>
            <div><strong>Account Type:</strong> {user.discriminator}</div>
            {user.fullName && (
              <div><strong>Full Name:</strong> {user.fullName.firstName} {user.fullName.lastName}</div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '20px' }}>Quick Actions</h3>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/admin/movies')}
              style={{
                background: '#1976d2',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              🎬 View All Movies
            </button>
            <button
              onClick={() => navigate('/admin/movies/new')}
              style={{
                background: '#4caf50',
                color: 'white',
                border: 'none',
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
            <button
              onClick={() => navigate('/admin/revenue')}
              style={{
                background: '#ff9800',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              💰 View Revenue Stats
            </button>
          </div>
        </div>

        {/* Movie Statistics */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '20px' }}>Movie Statistics</h3>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              Loading statistics...
            </div>
          ) : stats ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px'
            }}>
              <div style={{
                padding: '16px',
                backgroundColor: '#e3f2fd',
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
                  {stats.total || 0}
                </div>
                <div style={{ color: '#666' }}>Total Movies</div>
              </div>
              
              <div style={{
                padding: '16px',
                backgroundColor: '#e8f5e8',
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4caf50' }}>
                  {stats.by_status?.now_showing || 0}
                </div>
                <div style={{ color: '#666' }}>Now Showing</div>
              </div>
              
              <div style={{
                padding: '16px',
                backgroundColor: '#fff3e0',
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9800' }}>
                  {stats.by_status?.upcoming || 0}
                </div>
                <div style={{ color: '#666' }}>Upcoming</div>
              </div>
              
              <div style={{
                padding: '16px',
                backgroundColor: '#ffebee',
                borderRadius: '4px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f44336' }}>
                  {stats.by_status?.ended || 0}
                </div>
                <div style={{ color: '#666' }}>Ended</div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              <p>Unable to load statistics</p>
              <button
                onClick={fetchStats}
                style={{
                  background: '#1976d2',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
} 