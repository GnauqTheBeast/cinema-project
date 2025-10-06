import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const PermissionContext = createContext();

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

export const PermissionProvider = ({ children }) => {
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPermissions = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setPermissions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_URL}/auth/permissions`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPermissions(response.data.permissions.map(p => p.code));
      } else {
        setError('Failed to fetch permissions');
        setPermissions([]);
      }
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setError(err.response?.data?.message || 'Failed to fetch permissions');
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permissionCode) => {
    return permissions.includes(permissionCode);
  };

  const hasAnyPermission = (permissionCodes) => {
    return permissionCodes.some(code => permissions.includes(code));
  };

  const hasAllPermissions = (permissionCodes) => {
    return permissionCodes.every(code => permissions.includes(code));
  };

  const clearPermissions = () => {
    setPermissions([]);
    setError(null);
  };

  // Fetch permissions when component mounts or when admin token changes
  useEffect(() => {
    const handleTokenChange = () => {
      const token = localStorage.getItem('adminToken');
      if (token) {
        fetchPermissions();
      } else {
        clearPermissions();
      }
    };

    // Initial fetch
    handleTokenChange();

    // Listen for token changes
    window.addEventListener('tokenChange', handleTokenChange);

    return () => {
      window.removeEventListener('tokenChange', handleTokenChange);
    };
  }, []);

  const value = {
    permissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    fetchPermissions,
    clearPermissions
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export default PermissionContext;
