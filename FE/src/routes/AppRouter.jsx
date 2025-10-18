import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLoginPage from '../pages/admin/AdminLoginPage'
import DashboardPage from '../pages/admin/DashboardPage'
import MovieDetailPage from '../pages/admin/MovieDetailPage'
import MovieFormPage from '../pages/admin/MovieFormPage'
import MoviesPage from '../pages/admin/MoviesPage'
import RevenueStatsPage from '../pages/admin/RevenueStatsPage'
import RoomFormPage from '../pages/admin/RoomFormPage'
import RoomsPage from '../pages/admin/RoomsPage'
import SeatFormPage from '../pages/admin/SeatFormPage'
import SeatsPage from '../pages/admin/SeatsPage'
import ShowtimeFormPage from '../pages/admin/ShowtimeFormPage'
import ShowtimesPage from '../pages/admin/ShowtimesPage'
import StaffManagementPage from '../pages/admin/StaffManagementPage'
import HomePage from '../pages/client/HomePage'
import LoginPage from '../pages/client/LoginPage'
import ProfilePage from '../pages/client/ProfilePage'
import RegisterPage from '../pages/client/RegisterPage'
import ShowtimePage from '../pages/client/ShowtimePage'
import VerifyOtpPage from '../pages/client/VerifyOtpPage'

const AppRouter = ({ token, setToken, adminToken, setAdminToken }) => {
  const ProtectedRoute = ({ children }) => {
    return token ? children : <Navigate to="/login" replace />
  }

  const AdminRoute = ({ children }) => {
    if (!adminToken) {
      return <Navigate to="/admin/login" replace />
    }

    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}')
    if (
      adminUser.role !== 'admin' &&
      adminUser.role !== 'manager_staff' &&
      adminUser.role !== 'ticket_staff'
    ) {
      return <Navigate to="/admin/login" replace />
    }

    return children
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route
        path="/login"
        element={
          !token ? (
            <LoginPage onLogin={() => window.location.reload()} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route path="/register" element={!token ? <RegisterPage /> : <Navigate to="/" replace />} />
      <Route path="/verify" element={!token ? <VerifyOtpPage /> : <Navigate to="/" replace />} />

      {/* Admin Login */}
      <Route
        path="/admin/login"
        element={!adminToken ? <AdminLoginPage /> : <Navigate to="/admin/dashboard" replace />}
      />

      {/* User Routes */}
      <Route path="/showtimes" element={<ShowtimePage />} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <AdminRoute>
            <DashboardPage />
          </AdminRoute>
        }
      />

      {/* Movie Routes */}
      <Route
        path="/admin/movies"
        element={
          <AdminRoute>
            <MoviesPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/movies/new"
        element={
          <AdminRoute>
            <MovieFormPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/movies/:id"
        element={
          <AdminRoute>
            <MovieDetailPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/movies/:id/edit"
        element={
          <AdminRoute>
            <MovieFormPage />
          </AdminRoute>
        }
      />

      {/* Room Routes */}
      <Route
        path="/admin/rooms"
        element={
          <AdminRoute>
            <RoomsPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/rooms/new"
        element={
          <AdminRoute>
            <RoomFormPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/rooms/:id/edit"
        element={
          <AdminRoute>
            <RoomFormPage />
          </AdminRoute>
        }
      />

      {/* Seat Routes */}
      <Route
        path="/admin/seats"
        element={
          <AdminRoute>
            <SeatsPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/seats/new"
        element={
          <AdminRoute>
            <SeatFormPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/seats/:id/edit"
        element={
          <AdminRoute>
            <SeatFormPage />
          </AdminRoute>
        }
      />

      {/* Showtime Routes */}
      <Route
        path="/admin/showtimes"
        element={
          <AdminRoute>
            <ShowtimesPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/showtimes/new"
        element={
          <AdminRoute>
            <ShowtimeFormPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/showtimes/:id/edit"
        element={
          <AdminRoute>
            <ShowtimeFormPage />
          </AdminRoute>
        }
      />

      {/* Revenue Stats */}
      <Route
        path="/admin/revenue"
        element={
          <AdminRoute>
            <RevenueStatsPage />
          </AdminRoute>
        }
      />

      {/* Staff Management */}
      <Route
        path="/admin/staff"
        element={
          <AdminRoute>
            <StaffManagementPage />
          </AdminRoute>
        }
      />

      {/* Default redirects */}
      <Route path="/admin" element={<Navigate to="/admin/movies" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default AppRouter
