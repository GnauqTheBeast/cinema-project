import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPage from '../pages/admin/DashboardPage';
import MoviesPage from '../pages/admin/MoviesPage';
import MovieDetailPage from '../pages/admin/MovieDetailPage';
import MovieFormPage from '../pages/admin/MovieFormPage';
import RevenueStatsPage from '../pages/admin/RevenueStatsPage';

const AppRouter = ({ token }) => {
  const ProtectedRoute = ({ children }) => {
    return token ? children : <Navigate to="/login" replace />;
  };

  const AdminRoute = ({ children }) => {
    return token ? children : <Navigate to="/login" replace />;
  };

  return (
    <Routes>
      {/* Public Routes */}
      <Route 
        path="/login" 
        element={!token ? <LoginPage /> : <Navigate to="/admin/movies" replace />} 
      />
      <Route 
        path="/register" 
        element={!token ? <RegisterPage /> : <Navigate to="/admin/movies" replace />} 
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
      <Route path="/" element={<Navigate to={token ? "/admin/movies" : "/login"} replace />} />
      <Route path="*" element={<Navigate to={token ? "/admin/movies" : "/login"} replace />} />
    </Routes>
  );
};

export default AppRouter; 