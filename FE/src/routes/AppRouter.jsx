import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLoginPage from '../pages/admin/AdminLoginPage'
import BoxOfficePage from '../pages/admin/BoxOfficePage'
import ChatbotDocumentsPage from '../pages/admin/ChatbotDocumentsPage'
import DashboardPage from '../pages/admin/DashboardPage'
import MovieDetailPage from '../pages/admin/MovieDetailPage'
import MovieFormPage from '../pages/admin/MovieFormPage'
import AdminMoviesPage from '../pages/admin/MoviesPage'
import AdminNewsPage from '../pages/admin/NewsPage'
import NewsFormPage from '../pages/admin/NewsFormPage'
import RevenueStatsPage from '../pages/admin/RevenueStatsPage'
import RoomFormPage from '../pages/admin/RoomFormPage'
import RoomsPage from '../pages/admin/RoomsPage'
import SeatFormPage from '../pages/admin/SeatFormPage'
import SeatsPage from '../pages/admin/SeatsPage'
import ShowtimeFormPage from '../pages/admin/ShowtimeFormPage'
import ShowtimesPage from '../pages/admin/ShowtimesPage'
import StaffManagementPage from '../pages/admin/StaffManagementPage'
import StaffPage from '../pages/admin/StaffPage'
import StaffFormPage from '../pages/admin/StaffFormPage'
import BookingPage from '../pages/client/BookingPage'
import BookingHistoryPage from '../pages/client/BookingHistoryPage'
import BookingSuccessPage from '../pages/client/BookingSuccessPage'
import HomePage from '../pages/client/HomePage'
import LoginPage from '../pages/client/LoginPage'
import MoviesPage from '../pages/client/MoviesPage'
import NewsPage from '../pages/client/NewsPage'
import PaymentPage from '../pages/client/PaymentPage'
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

  const TicketStaffRoute = ({ children }) => {
    if (!adminToken) {
      return <Navigate to="/admin/login" replace />
    }

    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}')
    if (adminUser.role !== 'ticket_staff') {
      return <Navigate to="/admin/dashboard" replace />
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
      <Route path="/movies" element={<MoviesPage />} />
      <Route path="/showtimes" element={<ShowtimePage />} />
      <Route path="/news" element={<NewsPage />} />
      <Route
        path="/profile"
        element={
            <ProfilePage />
        }
      />
      <Route
        path="/showtimes/:showtimeId/booking"
        element={
            <BookingPage />
        }
      />
      <Route
        path="/booking/:bookingId/payment"
        element={
            <PaymentPage />
        }
      />
      <Route
        path="/booking-history"
        element={
            <BookingHistoryPage />
        }
      />
      <Route
        path="/booking-success"
        element={
            <BookingSuccessPage />
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
            <AdminMoviesPage />
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

      {/* News Routes */}
      <Route
        path="/admin/news"
        element={
          <AdminRoute>
            <AdminNewsPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/news/:id/edit"
        element={
          <AdminRoute>
            <NewsFormPage />
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
            <StaffPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/staff/new"
        element={
          <AdminRoute>
            <StaffFormPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/staff/:id"
        element={
          <AdminRoute>
            <StaffPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/staff/:id/edit"
        element={
          <AdminRoute>
            <StaffFormPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/staff-old"
        element={
          <AdminRoute>
            <StaffManagementPage />
          </AdminRoute>
        }
      />

      <Route
        path="/admin/box-office"
        element={
          <TicketStaffRoute>
            <BoxOfficePage />
          </TicketStaffRoute>
        }
      />

      {/* Chatbot Documents */}
      <Route
        path="/admin/chatbot-documents"
        element={
          <AdminRoute>
            <ChatbotDocumentsPage />
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
