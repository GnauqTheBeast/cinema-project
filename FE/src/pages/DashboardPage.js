import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Gửi custom event để App cập nhật token
    window.dispatchEvent(new Event('tokenChange'));
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div style={{ maxWidth: 600, margin: '40px auto' }}>
      <h2>Dashboard</h2>
      <div><b>Email:</b> {user.email}</div>
      <div><b>Account Type:</b> {user.discriminator}</div>
      {user.fullName && (
        <div><b>Name:</b> {user.fullName.firstName} {user.fullName.lastName}</div>
      )}
      <button onClick={handleLogout} style={{ marginTop: 20 }}>Logout</button>
    </div>
  );
}
