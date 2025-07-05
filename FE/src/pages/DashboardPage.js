import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Star, Briefcase, MapPin } from 'lucide-react';

const DashboardPage = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">Cinema Dashboard</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                Welcome, <span className="font-medium">{user?.fullName?.firstName || user?.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="btn-outline flex items-center space-x-2 text-sm"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="card">
              <div className="card-header">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {user?.fullName ? `${user.fullName.firstName} ${user.fullName.lastName}` : user?.username}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center space-x-1">
                      {user?.userType === 'Customer' ? (
                        <>
                          <User className="h-4 w-4" />
                          <span>Customer</span>
                        </>
                      ) : (
                        <>
                          <Briefcase className="h-4 w-4" />
                          <span>Staff</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="card-content space-y-4">
                {/* Basic Info */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Account Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Username:</span>
                      <span className="font-medium">{user?.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Account Type:</span>
                      <span className="font-medium">{user?.userType}</span>
                    </div>
                  </div>
                </div>

                {/* Address */}
                {user?.address && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>Address</span>
                    </h4>
                    <div className="text-sm text-gray-600">
                      <p>{user.address.street}</p>
                      <p>{user.address.city}</p>
                    </div>
                  </div>
                )}

                {/* Customer-specific info */}
                {user?.userType === 'Customer' && user?.customer && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center space-x-1">
                      <Star className="h-4 w-4" />
                      <span>Customer Status</span>
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Reward Points:</span>
                        <span className="font-medium text-primary-600">{user.customer.rewardPoint}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Ranking:</span>
                        <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                          user.customer.ranking === 'Diamond' ? 'bg-purple-100 text-purple-800' :
                          user.customer.ranking === 'Platinum' ? 'bg-gray-100 text-gray-800' :
                          user.customer.ranking === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                          user.customer.ranking === 'Silver' ? 'bg-gray-100 text-gray-600' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {user.customer.ranking}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Staff-specific info */}
                {user?.userType === 'Staff' && user?.staff && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center space-x-1">
                      <Briefcase className="h-4 w-4" />
                      <span>Staff Information</span>
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Position:</span>
                        <span className="font-medium">{user.staff.position}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Salary:</span>
                        <span className="font-medium text-green-600">
                          {new Intl.NumberFormat('vi-VN', { 
                            style: 'currency', 
                            currency: 'VND' 
                          }).format(user.staff.salary)}
                        </span>
                      </div>
                      {user.staff.title && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Title:</span>
                          <span className="font-medium">{user.staff.title}</span>
                        </div>
                      )}
                      {user.staff.managerCode && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Manager Code:</span>
                          <span className="font-medium">{user.staff.managerCode}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
