import React, { useState, useEffect } from 'react';
import AppRouter from './routes/AppRouter';

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  useEffect(() => {
    const onStorage = () => setToken(localStorage.getItem('token'));
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    const handler = () => setToken(localStorage.getItem('token'));
    window.addEventListener('tokenChange', handler);
    return () => window.removeEventListener('tokenChange', handler);
  }, []);

  return <AppRouter token={token} />;
}

export default App; 