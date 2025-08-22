import React, { useState, useEffect } from 'react';
import AppRouter from './routes/AppRouter';
import ChatBot from './components/ChatBot';
import NotificationComponent from './components/NotificationComponent';
import websocketService from './services/websocketService';

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

  // WebSocket connection management
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (token && user) {
      try {
        const userData = JSON.parse(user);
        if (userData.id) {
          websocketService.connect(userData.id.toString());
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    } else {
      websocketService.disconnect();
    }

    return () => {
      websocketService.disconnect();
    };
  }, [token]);

  return (
    <>
      <AppRouter token={token} setToken={setToken} adminToken={adminToken} setAdminToken={setAdminToken} />
      <ChatBot />
      {token && <NotificationComponent />}
    </>
  );
}

export default App; 