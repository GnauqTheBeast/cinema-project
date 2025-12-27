import { useState } from 'react'
import {
  FaBars,
  FaChartBar,
  FaClock,
  FaCouch,
  FaDoorOpen,
  FaFilm,
  FaHome,
  FaMoneyBillWave,
  FaNewspaper,
  FaRobot,
  FaShoppingCart,
  FaSignOutAlt,
  FaTimes,
  FaUser,
} from 'react-icons/fa'
import { useLocation, useNavigate } from 'react-router-dom'

export default function AdminLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}')
  const role = adminUser?.role || ''

  const visiblePathsByRole = {
    admin: 'all',
    manager_staff: new Set([
      '/admin/dashboard',
      '/admin/movies',
      '/admin/news',
      '/admin/rooms',
      '/admin/seats',
      '/admin/showtimes',
      '/admin/chatbot-documents',
    ]),
    ticket_staff: new Set([
      '/admin/dashboard',
      '/admin/showtimes',
      '/admin/box-office',
    ]),
  }

  const isItemVisibleForRole = (path) => {
    if (!role) return false
    if (visiblePathsByRole[role] === 'all') return true
    const allowed = visiblePathsByRole[role]
    return allowed ? allowed.has(path) : false
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    window.dispatchEvent(new Event('tokenChange'))
    navigate('/admin/login')
  }

  const isActiveRoute = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const navItems = [
    {
      path: '/admin/dashboard',
      label: 'Dashboard',
      icon: FaChartBar,
      permission: 'profile_view',
    },
    {
      path: '/admin/movies',
      label: 'Quản lý phim',
      icon: FaFilm,
      permission: 'movie_manage',
    },
    {
      path: '/admin/news',
      label: 'Tin tức',
      icon: FaNewspaper,
      permission: 'news_manage',
    },
    {
      path: '/admin/rooms',
      label: 'Phòng chiếu',
      icon: FaDoorOpen,
      permission: 'seat_manage',
    },
    {
      path: '/admin/seats',
      label: 'Ghế ngồi',
      icon: FaCouch,
      permission: 'seat_manage',
    },
    {
      path: '/admin/showtimes',
      label: 'Lịch chiếu',
      icon: FaClock,
      permission: 'showtime_manage',
    },
    {
      path: '/admin/box-office',
      label: 'Bán vé tại quầy',
      icon: FaShoppingCart,
      permission: 'ticket_sell',
    },
    {
      path: '/admin/revenue',
      label: 'Doanh thu',
      icon: FaMoneyBillWave,
      permission: 'report_view',
    },
    {
      path: '/admin/staff',
      label: 'Nhân viên',
      icon: FaUser,
      permission: 'staff_manage',
    },
    {
      path: '/admin/chatbot-documents',
      label: 'Chatbot Documents',
      icon: FaRobot,
      permission: 'chatbot_manage',
    },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB' }}>
      <header
        style={{
          background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 50%, #B91C1C 100%)',
          color: '#FFFFFF',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.08)',
          position: 'sticky',
          top: 0,
          zIndex: 30,
          height: '64px',
        }}
      >
        <div style={{ padding: '0 24px', height: '100%', display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                style={{
                  padding: '8px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: 'none',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'background-color 150ms ease-in-out',
                  display: window.innerWidth >= 1024 ? 'none' : 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                {isSidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #FCA5A5 0%, #EF4444 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <FaFilm style={{ color: '#FFFFFF', fontSize: '18px' }} />
                </div>
                <div>
                  <h1
                    style={{
                      fontSize: '20px',
                      fontWeight: 700,
                      fontFamily: "'Poppins', sans-serif",
                      margin: 0,
                    }}
                  >
                    HQ Cinema Admin
                  </h1>
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'rgba(255, 255, 255, 0.9)',
                      margin: 0,
                      fontFamily: "'Open Sans', sans-serif",
                    }}
                  >
                    Hệ thống quản lý rạp chiếu phim
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'rgba(255, 255, 255, 0.9)',
                }}
              >
                <FaUser style={{ fontSize: '14px' }} />
                <span style={{ fontSize: '14px', fontFamily: "'Open Sans', sans-serif" }}>
                  {adminUser?.name || 'Admin'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  cursor: 'pointer',
                  transition: 'all 200ms ease-in-out',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  fontFamily: "'Open Sans', sans-serif",
                  fontSize: '14px',
                  fontWeight: 500,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)'
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 0, 0, 0.2)'
                  e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}
              >
                <FaSignOutAlt size={16} />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div style={{ display: 'flex' }}>
        <aside
          style={{
            position: window.innerWidth >= 1024 ? 'static' : 'fixed',
            transform:
              window.innerWidth >= 1024 || isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
            zIndex: 40,
            width: '256px',
            height: 'calc(100vh - 64px)',
            transition: 'transform 300ms ease-in-out',
            backgroundColor: '#FFFFFF',
            borderRight: '1px solid #E5E7EB',
            overflowY: 'auto',
          }}
        >
          {isSidebarOpen && window.innerWidth < 1024 && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(17, 24, 39, 0.5)',
                zIndex: 30,
                backdropFilter: 'blur(2px)',
              }}
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          <div
            style={{
              position: 'relative',
              zIndex: 40,
              height: '100%',
              backgroundColor: '#FFFFFF',
            }}
          >
            <nav style={{ padding: '24px 0' }}>
              <div style={{ marginBottom: '24px', padding: '0 16px' }}>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '12px 16px',
                    color: '#6B7280',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 150ms ease-in-out',
                    fontFamily: "'Open Sans', sans-serif",
                    fontSize: '14px',
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F9FAFB'
                    e.currentTarget.style.color = '#111827'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = '#6B7280'
                  }}
                >
                  <FaHome size={18} />
                  <span>Về trang chủ</span>
                </button>
              </div>

              <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {navItems.map((item) => {
                  const IconComponent = item.icon
                  const isActive = isActiveRoute(item.path)

                  if (!isItemVisibleForRole(item.path)) return null

                  if (item.path === '/admin/box-office' && role !== 'ticket_staff') return null

                  return (
                    <button
                      type="button"
                      key={item.path}
                      onClick={() => {
                        navigate(item.path)
                        setIsSidebarOpen(false)
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 150ms ease-in-out',
                        fontFamily: "'Open Sans', sans-serif",
                        fontSize: '14px',
                        fontWeight: isActive ? 600 : 500,
                        background: isActive
                          ? 'linear-gradient(135deg, #FEE2E2 0%, #FEF2F2 100%)'
                          : 'transparent',
                        color: isActive ? '#DC2626' : '#6B7280',
                        borderLeft: isActive ? '3px solid #EF4444' : '3px solid transparent',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = '#F9FAFB'
                          e.currentTarget.style.color = '#111827'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent'
                          e.currentTarget.style.color = '#6B7280'
                        }
                      }}
                    >
                      <IconComponent size={18} />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </nav>

            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '16px',
                backgroundColor: '#F9FAFB',
                borderTop: '1px solid #E5E7EB',
              }}
            >
              <div
                style={{
                  textAlign: 'center',
                  fontSize: '12px',
                  color: '#9CA3AF',
                  fontFamily: "'Open Sans', sans-serif",
                }}
              >
                <p style={{ margin: 0 }}>HQ Cinema Admin v1.0</p>
                <p style={{ margin: '4px 0 0 0' }}>© 2025 All rights reserved</p>
              </div>
            </div>
          </div>
        </aside>

        <main
          style={{
            flex: 1,
            minHeight: 'calc(100vh - 64px)',
            backgroundColor: '#F9FAFB',
          }}
        >
          <div style={{ padding: '32px' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}
