import React, { useState, useEffect } from 'react';
import AppRouter from './routes/AppRouter';
import ChatBot from './components/ChatBot';
import { PermissionProvider } from './contexts/PermissionContext';

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem('adminToken'));

  useEffect(() => {
    const onStorage = () => {
      setToken(localStorage.getItem('token'));
      setAdminToken(localStorage.getItem('adminToken'));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    const handler = () => {
      setToken(localStorage.getItem('token'));
      setAdminToken(localStorage.getItem('adminToken'));
    };
    window.addEventListener('tokenChange', handler);
    return () => window.removeEventListener('tokenChange', handler);
  }, []);

  return (
    <PermissionProvider>
      <AppRouter token={token} setToken={setToken} adminToken={adminToken} setAdminToken={setAdminToken} />
      <ChatBot />
    </PermissionProvider>
  );
}

export default App; 