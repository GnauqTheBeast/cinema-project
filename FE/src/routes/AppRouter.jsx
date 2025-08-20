import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import VerifyOtpPage from '../pages/VerifyOtpPage';
import HomePage from '../pages/HomePage';
import AdminLoginPage from '../pages/admin/AdminLoginPage';
import DashboardPage from '../pages/admin/DashboardPage';
import MoviesPage from '../pages/admin/MoviesPage';
import MovieDetailPage from '../pages/admin/MovieDetailPage';
import MovieFormPage from '../pages/admin/MovieFormPage';
import RevenueStatsPage from '../pages/admin/RevenueStatsPage';
import RoomsPage from '../pages/admin/RoomsPage';
import RoomFormPage from '../pages/admin/RoomFormPage';
import SeatsPage from '../pages/admin/SeatsPage';
import SeatFormPage from '../pages/admin/SeatFormPage';
import ShowtimesPage from '../pages/admin/ShowtimesPage';
import ShowtimeFormPage from '../pages/admin/ShowtimeFormPage';

const AppRouter = ({ token, setToken }) => {
  const ProtectedRoute = ({ children }) => {
    return token ? children : <Navigate to="/login" replace />;
  };

  const AdminRoute = ({ children }) => {
    if (!token) {
      return <Navigate to="/admin/login" replace />;
    }
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin' && user.role !== 'staff') {
      return <Navigate to="/admin/login" replace />;
    }
    
    return children;
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route 
        path="/login" 
        element={!token ? <LoginPage onLogin={() => window.location.reload()} /> : <Navigate to="/" replace />} 
      />
      <Route 
        path="/register" 
        element={!token ? <RegisterPage /> : <Navigate to="/" replace />} 
      />
      <Route 
        path="/verify" 
        element={!token ? <VerifyOtpPage /> : <Navigate to="/" replace />} 
      />

      {/* Admin Login */}
      <Route 
        path="/admin/login" 
        element={!token ? <AdminLoginPage /> : <Navigate to="/admin/dashboard" replace />} 
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

      {/* Default redirects */}
      <Route path="/admin" element={<Navigate to="/admin/movies" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter; 