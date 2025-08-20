import React, { useState } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaCalendarAlt, FaMapMarkerAlt, FaEdit, FaSave, FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';
import Header from '../components/Header';

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Mock user data
  const [userData, setUserData] = useState({
    id: 1,
    name: 'Nguyễn Văn Quang',
    email: 'quangnv@example.com',
    phone: '0123456789',
    birthDate: '1995-08-15',
    address: '123 Đường ABC, Quận 1, TP.HCM',
    gender: 'male',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    joinDate: '2024-01-15',
    membershipType: 'VIP',
    totalBookings: 25,
    favoriteGenres: ['Hành động', 'Khoa học viễn tưởng', 'Kinh dị']
  });

  const [editForm, setEditForm] = useState({...userData});

  const handleEdit = () => {
    setIsEditing(true);
    setEditForm({...userData});
  };

  const handleSave = () => {
    setUserData({...editForm});
    setIsEditing(false);
    // TODO: Call API to update user data
    console.log('Saving user data:', editForm);
  };

  const handleCancel = () => {
    setEditForm({...userData});
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getMembershipColor = (type) => {
    switch (type) {
      case 'VIP': return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 'Premium': return 'bg-gradient-to-r from-purple-400 to-purple-600';
      default: return 'bg-gradient-to-r from-gray-400 to-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-gray-900 rounded-2xl p-8 mb-8">
          <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
            {/* Avatar */}
            <div className="relative">
              <img
                src={userData.avatar}
                alt="Avatar"
                className="w-32 h-32 rounded-full object-cover border-4 border-red-600"
              />
              <div className={`absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-xs font-bold text-white ${getMembershipColor(userData.membershipType)}`}>
                {userData.membershipType}
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center lg:text-left">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
                <h1 className="text-3xl font-bold text-white mb-2 lg:mb-0">{userData.name}</h1>
                {!isEditing ? (
                  <button
                    onClick={handleEdit}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors duration-300 flex items-center space-x-2 mx-auto lg:mx-0"
                  >
                    <FaEdit />
                    <span>Chỉnh sửa</span>
                  </button>
                ) : (
                  <div className="flex space-x-2 mx-auto lg:mx-0">
                    <button
                      onClick={handleSave}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-300 flex items-center space-x-2"
                    >
                      <FaSave />
                      <span>Lưu</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-300 flex items-center space-x-2"
                    >
                      <FaTimes />
                      <span>Hủy</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-300">
                <div className="text-center lg:text-left">
                  <p className="text-gray-400 text-sm">Tham gia từ</p>
                  <p className="font-medium">{formatDate(userData.joinDate)}</p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-gray-400 text-sm">Tổng số vé đã đặt</p>
                  <p className="font-medium text-red-400">{userData.totalBookings} vé</p>
                </div>
                <div className="text-center lg:text-left">
                  <p className="text-gray-400 text-sm">Thể loại yêu thích</p>
                  <p className="font-medium">{userData.favoriteGenres.join(', ')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personal Information */}
          <div className="bg-gray-900 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
              <FaUser className="text-red-600" />
              <span>Thông tin cá nhân</span>
            </h2>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">Họ và tên</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full bg-black border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-red-600"
                  />
                ) : (
                  <p className="text-white">{userData.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2 flex items-center space-x-2">
                  <FaEnvelope className="w-4 h-4" />
                  <span>Email</span>
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full bg-black border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-red-600"
                  />
                ) : (
                  <p className="text-white">{userData.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2 flex items-center space-x-2">
                  <FaPhone className="w-4 h-4" />
                  <span>Số điện thoại</span>
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full bg-black border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-red-600"
                  />
                ) : (
                  <p className="text-white">{userData.phone}</p>
                )}
              </div>

              {/* Birth Date */}
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2 flex items-center space-x-2">
                  <FaCalendarAlt className="w-4 h-4" />
                  <span>Ngày sinh</span>
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editForm.birthDate}
                    onChange={(e) => handleInputChange('birthDate', e.target.value)}
                    className="w-full bg-black border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-red-600"
                  />
                ) : (
                  <p className="text-white">{formatDate(userData.birthDate)}</p>
                )}
              </div>

              {/* Gender */}
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">Giới tính</label>
                {isEditing ? (
                  <select
                    value={editForm.gender}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full bg-black border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-red-600"
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                ) : (
                  <p className="text-white">
                    {userData.gender === 'male' ? 'Nam' : userData.gender === 'female' ? 'Nữ' : 'Khác'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Address & Security */}
          <div className="space-y-8">
            {/* Address Information */}
            <div className="bg-gray-900 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center space-x-2">
                <FaMapMarkerAlt className="text-red-600" />
                <span>Địa chỉ</span>
              </h2>

              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">Địa chỉ hiện tại</label>
                {isEditing ? (
                  <textarea
                    value={editForm.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    rows="3"
                    className="w-full bg-black border border-gray-600 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-red-600 resize-none"
                  />
                ) : (
                  <p className="text-white">{userData.address}</p>
                )}
              </div>
            </div>

            {/* Security */}
            <div className="bg-gray-900 rounded-2xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Bảo mật</h2>
              
              <div className="space-y-4">
                <button className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center space-x-2">
                  <FaEyeSlash />
                  <span>Đổi mật khẩu</span>
                </button>
                
                <button className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors duration-300">
                  Bảo mật hai lớp
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Booking History Preview */}
        <div className="bg-gray-900 rounded-2xl p-6 mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Lịch sử đặt vé gần đây</h2>
            <button className="text-red-400 hover:text-red-300 font-medium transition-colors duration-300">
              Xem tất cả
            </button>
          </div>

          {/* Mock booking history */}
          <div className="space-y-4">
            {[
              {
                id: 1,
                movieTitle: 'Spider-Man: No Way Home',
                cinema: 'HQ Cinema Landmark 81',
                showtime: '2024-03-15 19:30',
                seats: 'G7, G8',
                status: 'Đã xem'
              },
              {
                id: 2,
                movieTitle: 'The Batman',
                cinema: 'HQ Cinema Vincom Center',
                showtime: '2024-03-10 21:00',
                seats: 'F5, F6',
                status: 'Đã xem'
              },
              {
                id: 3,
                movieTitle: 'Dune: Part Two',
                cinema: 'HQ Cinema Times Square',
                showtime: '2024-03-20 20:15',
                seats: 'H10, H11',
                status: 'Sắp diễn ra'
              }
            ].map((booking) => (
              <div key={booking.id} className="bg-black/50 rounded-lg p-4 border border-gray-700">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-1">{booking.movieTitle}</h3>
                    <p className="text-gray-400 text-sm mb-1">{booking.cinema}</p>
                    <p className="text-gray-400 text-sm">
                      {formatDate(booking.showtime)} - Ghế {booking.seats}
                    </p>
                  </div>
                  <div className="mt-2 md:mt-0">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      booking.status === 'Đã xem' 
                        ? 'bg-green-600/20 text-green-400' 
                        : 'bg-blue-600/20 text-blue-400'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}