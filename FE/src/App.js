import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';


function App() {
 const [token, setToken] = useState(() => localStorage.getItem('token'));


 useEffect(() => {
   const onStorage = () => setToken(localStorage.getItem('token'));
   window.addEventListener('storage', onStorage);
   return () => window.removeEventListener('storage', onStorage);
 }, []);


 // Listen for token changes from LoginPage
 useEffect(() => {
   const handler = () => setToken(localStorage.getItem('token'));
   window.addEventListener('tokenChange', handler);
   return () => window.removeEventListener('tokenChange', handler);
 }, []);


 return (
   <Routes>
     <Route path="/login" element={!token ? <LoginPage onLogin={() => setToken(localStorage.getItem('token'))} /> : <Navigate to="/dashboard" replace />} />
     <Route path="/register" element={!token ? <RegisterPage /> : <Navigate to="/dashboard" replace />} />
     <Route path="/dashboard" element={token ? <DashboardPage /> : <Navigate to="/login" replace />} />
     <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} replace />} />
   </Routes>
 );
}


export default App;