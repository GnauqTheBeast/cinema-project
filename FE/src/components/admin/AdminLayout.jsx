import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { usePermissions } from '../../contexts/PermissionContext'
import {
  FaChartBar,
  FaFilm,
  FaDoorOpen,
  FaCouch,
  FaClock,
  FaMoneyBillWave,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaHome,
  FaUser,
} from 'react-icons/fa'

export default function AdminLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const { hasPermission } = usePermissions()

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
      permission: 'profile_view', // Basic permission for dashboard
    },
    {
      path: '/admin/movies',
      label: 'Quản lý phim',
      icon: FaFilm,
      permission: 'movie_manage',
    },
    {
      path: '/admin/rooms',
      label: 'Phòng chiếu',
      icon: FaDoorOpen,
      permission: 'seat_manage', // Room management is part of seat management
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
      path: '/admin/revenue',
      label: 'Doanh thu',
      icon: FaMoneyBillWave,
      permission: 'report_view',
    },
    {
      path: '/admin/staff',
      label: 'Nhân viên',
      icon: FaUser,
      permission: 'staff_manage', // This permission needs to be added to the database
    },
    {
      path: '/admin/permissions',
      label: 'Test Quyền',
      icon: FaUser,
      permission: 'profile_view', // Basic permission for testing
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-600 to-red-800 text-white shadow-lg sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                {isSidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center shadow-lg">
                  <FaFilm className="text-white text-lg" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">HQ Cinema Admin</h1>
                  <p className="text-red-100 text-sm">Hệ thống quản lý rạp chiếu phim</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 text-red-100">
                <FaUser className="text-sm" />
                <span className="text-sm">Admin</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-red-700 hover:bg-red-800 px-4 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <FaSignOutAlt size={16} />
                <span className="hidden sm:block">Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } fixed lg:static lg:translate-x-0 z-40 w-64 h-screen transition-transform duration-300 ease-in-out bg-white border-r border-gray-200 shadow-lg lg:shadow-none`}
        >
          {/* Overlay for mobile */}
          {isSidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          <div className="relative z-40 h-full bg-white">
            <nav className="p-4 space-y-2">
              <div className="mb-6">
                <button
                  onClick={() => navigate('/')}
                  className="flex items-center space-x-3 w-full p-3 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                >
                  <FaHome size={18} />
                  <span>Về trang chủ</span>
                </button>
              </div>

              {navItems.map((item) => {
                const IconComponent = item.icon
                const isActive = isActiveRoute(item.path)

                // Check if user has permission for this menu item
                if (!hasPermission(item.permission)) {
                  return null
                }

                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path)
                      setIsSidebarOpen(false)
                    }}
                    className={`flex items-center space-x-3 w-full p-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md'
                        : 'text-gray-700 hover:text-red-600 hover:bg-red-50'
                    }`}
                  >
                    <IconComponent size={18} />
                    <span className="font-medium">{item.label}</span>
                    {isActive && <div className="ml-auto w-2 h-2 bg-white rounded-full" />}
                  </button>
                )
              })}
            </nav>

            {/* Sidebar Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gray-50 border-t border-gray-200">
              <div className="text-center text-xs text-gray-500">
                <p>HQ Cinema Admin v1.0</p>
                <p className="mt-1">© 2024 All rights reserved</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen bg-gray-50">
          <div className="p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">{children}</div>
          </div>
        </main>
      </div>
    </div>
  )
}
