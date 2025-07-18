import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FaEnvelope, FaLock, FaUserCircle } from 'react-icons/fa';


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
     setSuccess('Đăng ký thành công! Vui lòng kiểm tra email để xác thực.');
     setTimeout(() => navigate('/login'), 2000);
   } catch (err) {
     setError(err.response?.data?.message || 'Đăng ký thất bại');
   }
 };


 return (
   <div className="flex items-center justify-center min-h-screen bg-blue-900">
     <div className="w-full max-w-lg flex flex-col items-center">
       <div className="flex flex-col items-center mb-8">
         <FaUserCircle className="text-[100px] text-white bg-blue-800 rounded-full p-2 shadow-lg mb-2" />
       </div>
       <form onSubmit={handleSubmit} className="w-full bg-transparent flex flex-col gap-6">
         <div>
           <label className="block text-gray-200 mb-1">Email ID</label>
           <div className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm">
             <FaEnvelope className="text-blue-900 mr-2" />
             <input
               name="email"
               type="email"
               value={form.email}
               onChange={handleChange}
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
               name="password"
               type="password"
               value={form.password}
               onChange={handleChange}
               required
               className="flex-1 bg-transparent outline-none text-blue-900 placeholder-gray-400"
               placeholder="Password"
             />
           </div>
         </div>
         <div>
           <label className="block text-gray-200 mb-1">Confirm Password</label>
           <div className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm">
             <FaLock className="text-blue-900 mr-2" />
             <input
               name="confirmPassword"
               type="password"
               value={form.confirmPassword}
               onChange={handleChange}
               required
               className="flex-1 bg-transparent outline-none text-blue-900 placeholder-gray-400"
               placeholder="Confirm Password"
             />
           </div>
         </div>
         <div className="flex space-x-4">
           <div className="w-1/2">
             <label className="block text-gray-200 mb-1">First Name</label>
             <div className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm">
               <input
                 name="firstName"
                 value={form.firstName}
                 onChange={handleChange}
                 required
                 className="flex-1 bg-transparent outline-none text-blue-900 placeholder-gray-400"
                 placeholder="First Name"
               />
             </div>
           </div>
           <div className="w-1/2">
             <label className="block text-gray-200 mb-1">Last Name</label>
             <div className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm">
               <input
                 name="lastName"
                 value={form.lastName}
                 onChange={handleChange}
                 required
                 className="flex-1 bg-transparent outline-none text-blue-900 placeholder-gray-400"
                 placeholder="Last Name"
               />
             </div>
           </div>
         </div>
         <div>
           <label className="block text-gray-200 mb-1">Address</label>
           <div className="flex items-center bg-white rounded-full px-4 py-2 shadow-sm">
             <input
               name="address"
               value={form.address}
               onChange={handleChange}
               className="flex-1 bg-transparent outline-none text-blue-900 placeholder-gray-400"
               placeholder="Address"
             />
           </div>
         </div>
         {error && <div className="text-red-400 text-sm text-center">{error}</div>}
         {success && <div className="text-green-600 text-sm text-center">{success}</div>}
         <button
           type="submit"
           className="w-full bg-blue-800 hover:bg-blue-700 text-white font-semibold py-2 rounded-full transition duration-200 mt-2 shadow-md"
         >
           REGISTER
         </button>
       </form>
       <p className="mt-8 text-center text-gray-200 text-sm">
         Already have an account?{' '}
         <Link to="/login" className="text-white underline hover:text-blue-200">Login</Link>
       </p>
     </div>
   </div>
 );
}
