import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaSearch, FaMapMarkerAlt, FaBars, FaTimes } from 'react-icons/fa';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  return (
    <header className="bg-black/95 backdrop-blur-sm shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-12 h-12 bg-gradient-to-r from-red-600 to-red-800 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">HQ</span>
            </div>
            <span className="text-white font-bold text-xl hidden sm:block">Cinema</span>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-300 hover:text-red-400 transition-colors duration-300 font-medium">
              Trang chủ
            </Link>
            <Link to="/movies" className="text-gray-300 hover:text-red-400 transition-colors duration-300 font-medium">
              Phim
            </Link>
            <Link to="/showtimes" className="text-gray-300 hover:text-red-400 transition-colors duration-300 font-medium">
              Lịch chiếu
            </Link>
            <Link to="/cinemas" className="text-gray-300 hover:text-red-400 transition-colors duration-300 font-medium">
              Rạp HQ Cinema
            </Link>
            <Link to="/promotions" className="text-gray-300 hover:text-red-400 transition-colors duration-300 font-medium">
              Khuyến mãi
            </Link>
          </nav>

          {/* Right Side - Search, Location, User */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <button className="text-gray-300 hover:text-red-400 transition-colors duration-300 hidden sm:block">
              <FaSearch className="w-5 h-5" />
            </button>

            {/* Location */}
            <div className="hidden lg:flex items-center space-x-1 text-gray-300 hover:text-red-400 transition-colors duration-300 cursor-pointer">
              <FaMapMarkerAlt className="w-4 h-4" />
              <span className="text-sm">Hà Nội</span>
            </div>

            {/* User Menu */}
            {token ? (
              <div className="relative group">
                <button className="flex items-center space-x-2 text-gray-300 hover:text-red-400 transition-colors duration-300">
                  <FaUser className="w-5 h-5" />
                  <span className="hidden sm:block">{user.name || 'User'}</span>
                </button>
                
                {/* Dropdown */}
                <div className="absolute right-0 mt-2 w-48 bg-black/90 backdrop-blur-sm border border-red-600/30 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                  <div className="py-2">
                    <Link to="/profile" className="block px-4 py-2 text-gray-300 hover:text-red-400 hover:bg-red-900/20 transition-colors duration-300">
                      Thông tin cá nhân
                    </Link>
                    <Link to="/bookings" className="block px-4 py-2 text-gray-300 hover:text-red-400 hover:bg-red-900/20 transition-colors duration-300">
                      Lịch sử đặt vé
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-gray-300 hover:text-red-400 hover:bg-red-900/20 transition-colors duration-300"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link 
                  to="/login"
                  className="bg-transparent border border-red-600 text-red-400 hover:bg-red-600 hover:text-white px-4 py-2 rounded-lg transition-all duration-300 text-sm font-medium"
                >
                  Đăng nhập
                </Link>
                <Link 
                  to="/register"
                  className="bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white px-4 py-2 rounded-lg transition-all duration-300 text-sm font-medium"
                >
                  Đăng ký
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-gray-300 hover:text-red-400 transition-colors duration-300"
            >
              {isMenuOpen ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-800">
            <nav className="flex flex-col space-y-2">
              <Link to="/" className="text-gray-300 hover:text-red-400 transition-colors duration-300 py-2 font-medium">
                Trang chủ
              </Link>
              <Link to="/movies" className="text-gray-300 hover:text-red-400 transition-colors duration-300 py-2 font-medium">
                Phim
              </Link>
              <Link to="/showtimes" className="text-gray-300 hover:text-red-400 transition-colors duration-300 py-2 font-medium">
                Lịch chiếu
              </Link>
              <Link to="/cinemas" className="text-gray-300 hover:text-red-400 transition-colors duration-300 py-2 font-medium">
                Rạp HQ Cinema
              </Link>
              <Link to="/promotions" className="text-gray-300 hover:text-red-400 transition-colors duration-300 py-2 font-medium">
                Khuyến mãi
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}