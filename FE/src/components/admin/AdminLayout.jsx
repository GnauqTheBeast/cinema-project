import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('tokenChange'));
    navigate('/login');
  };

  const isActiveRoute = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const navItems = [
    { path: '/admin/dashboard', label: '📊 Dashboard', icon: '📊' },
    { path: '/admin/movies', label: '🎬 Movies', icon: '🎬' },
    { path: '/admin/revenue', label: '💰 Revenue', icon: '💰' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#1976d2',
        color: 'white',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>🎬 Cinema Admin</h1>
        <button
          onClick={handleLogout}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </header>

      <div style={{ display: 'flex' }}>
        {/* Sidebar */}
        <nav style={{
          width: '250px',
          backgroundColor: 'white',
          minHeight: 'calc(100vh - 64px)',
          borderRight: '1px solid #e0e0e0',
          padding: '16px 0'
        }}>
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                width: '100%',
                padding: '12px 24px',
                border: 'none',
                backgroundColor: isActiveRoute(item.path) ? '#e3f2fd' : 'transparent',
                color: isActiveRoute(item.path) ? '#1976d2' : '#666',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '16px',
                borderLeft: isActiveRoute(item.path) ? '4px solid #1976d2' : '4px solid transparent',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!isActiveRoute(item.path)) {
                  e.target.style.backgroundColor = '#f5f5f5';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActiveRoute(item.path)) {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Main Content */}
        <main style={{ flex: 1, padding: '24px' }}>
          {children}
        </main>
      </div>
    </div>
  );
} 