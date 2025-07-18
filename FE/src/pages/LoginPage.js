import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FaEnvelope, FaLock, FaUserCircle } from 'react-icons/fa';


const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';


export default function LoginPage({ onLogin }) {
 const [email, setEmail] = useState('');
 const [password, setPassword] = useState('');
 const [error, setError] = useState('');
 const [remember, setRemember] = useState(false);
 const navigate = useNavigate();


 const handleSubmit = async (e) => {
   e.preventDefault();
   setError('');
   try {
     const res = await axios.post(`${API_URL}/auth/login`, { email, password });
     localStorage.setItem('token', res.data.token);
     localStorage.setItem('user', JSON.stringify(res.data.user));
     if (onLogin) onLogin();
     navigate('/dashboard');
   } catch (err) {
     setError(err.response?.data?.message || 'Login failed');
   }
 };


 return (
   <div className="flex items-center justify-center min-h-screen bg-blue-900">
     <div className="w-full max-w-md flex flex-col items-center">
       <div className="flex flex-col items-center mb-8">
         <FaUserCircle className="text-[100px] text-white bg-blue-800 rounded-full p-2 shadow-lg mb-2" />
       </div>
       <form onSubmit={handleSubmit} className="w-full bg-transparent flex flex-col gap-6">
         <div>
           <label className="block text-gray-200 mb-1">Email ID</label>
           <div className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm">
             <FaEnvelope className="text-blue-900 mr-2" />
             <input
               type="email"
               value={email}
               onChange={e => setEmail(e.target.value)}
               required
               className="flex-1 bg-transparent outline-none text-blue-900 placeholder-gray-400"
               placeholder="Email ID"
             />
           </div>
         </div>
         <div>
           <label className="block text-gray-200 mb-1">Password</label>
           <div className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm">
             <FaLock className="text-blue-900 mr-2" />
             <input
               type="password"
               value={password}
               onChange={e => setPassword(e.target.value)}
               required
               className="flex-1 bg-transparent outline-none text-blue-900 placeholder-gray-400"
               placeholder="Password"
             />
           </div>
         </div>
         <div className="flex items-center justify-between text-gray-200 text-sm mt-1">
           <label className="flex items-center">
             <input
               type="checkbox"
               checked={remember}
               onChange={e => setRemember(e.target.checked)}
               className="form-checkbox rounded text-blue-700 mr-2"
             />
             Remember me
           </label>
           <button type="button" className="hover:underline text-gray-300 font-light italic">Forgot Password?</button>
         </div>
         {error && <div className="text-red-400 text-sm text-center">{error}</div>}
         <button
           type="submit"
           className="w-full bg-blue-800 hover:bg-blue-700 text-white font-semibold py-2 rounded-full transition duration-200 mt-2 shadow-md"
         >
           LOGIN
         </button>
       </form>
       <p className="mt-8 text-center text-gray-200 text-sm">
         Don't Have an account?{' '}
         <Link to="/register" className="text-white underline hover:text-blue-200">Register</Link>
       </p>
     </div>
   </div>
 );
}


