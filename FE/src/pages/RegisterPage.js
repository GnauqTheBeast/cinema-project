import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setSuccess('');
    const data = {
      ...form,
      discriminator: 'Customer'
    };
    try {
      await axios.post(`${API_URL}/auth/register`, data);
      setSuccess('Registration successful! Please check your email to verify.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div style={{ maxWidth: 500, margin: '40px auto' }}>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <div><label>Email</label><input name="email" type="email" value={form.email} onChange={handleChange} required /></div>
        <div><label>Password</label><input name="password" type="password" value={form.password} onChange={handleChange} required /></div>
        <div><label>Confirm Password</label><input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required /></div>
        <div><label>First Name</label><input name="firstName" value={form.firstName} onChange={handleChange} required /></div>
        <div><label>Last Name</label><input name="lastName" value={form.lastName} onChange={handleChange} required /></div>
        <div><label>Address</label><input name="address" value={form.address} onChange={handleChange} /></div>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        {success && <div style={{ color: 'green' }}>{success}</div>}
        <button type="submit">Register</button>
      </form>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
}