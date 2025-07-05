import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthLayout from '../components/AuthLayout';

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser, loading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch
  } = useForm({
    defaultValues: {
      userType: 'Customer'
    }
  });

  const watchedPassword = watch('password');

  const onSubmit = async (data) => {
    const result = await registerUser(data);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError('root', { message: result.error });
    }
  };

  return (
    <AuthLayout 
      title="Create your account"
      subtitle="Join Cinema today! Please fill in your details."
    >
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {/* Hidden User Type - Always Customer */}
        <input
          type="hidden"
          value="Customer"
          {...register('userType')}
        />

        {/* Username */}
        <div className="form-group">
          <label htmlFor="username" className="form-label">
            Username
          </label>
          <input
            id="username"
            type="text"
            autoComplete="username"
            className={`input ${errors.username ? 'border-red-500' : ''}`}
            placeholder="Choose a username"
            {...register('username', {
              required: 'Username is required',
              minLength: {
                value: 3,
                message: 'Username must be at least 3 characters'
              },
              pattern: {
                value: /^[a-zA-Z0-9]+$/,
                message: 'Username can only contain letters and numbers'
              }
            })}
          />
          {errors.username && (
            <p className="form-error">{errors.username.message}</p>
          )}
        </div>

        {/* Personal Information */}
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label htmlFor="firstName" className="form-label">
              First Name
            </label>
            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
              className={`input ${errors.firstName ? 'border-red-500' : ''}`}
              placeholder="First name"
              {...register('firstName', {
                required: 'First name is required',
                minLength: {
                  value: 1,
                  message: 'First name is required'
                }
              })}
            />
            {errors.firstName && (
              <p className="form-error">{errors.firstName.message}</p>
            )}
          </div>
        </div>

        {/* Address Information */}
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label htmlFor="city" className="form-label">
              City
            </label>
            <input
              id="city"
              type="text"
              autoComplete="address-level2"
              className={`input ${errors.city ? 'border-red-500' : ''}`}
              placeholder="City"
              {...register('city', {
                required: 'City is required',
                minLength: {
                  value: 1,
                  message: 'City is required'
                }
              })}
            />
            {errors.city && (
              <p className="form-error">{errors.city.message}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="street" className="form-label">
              Street Address
            </label>
            <input
              id="street"
              type="text"
              autoComplete="street-address"
              className={`input ${errors.street ? 'border-red-500' : ''}`}
              placeholder="Street address"
              {...register('street', {
                required: 'Street address is required',
                minLength: {
                  value: 1,
                  message: 'Street address is required'
                }
              })}
            />
            {errors.street && (
              <p className="form-error">{errors.street.message}</p>
            )}
          </div>
        </div>



        {/* Password */}
        <div className="form-group">
          <label htmlFor="password" className="form-label">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={`input pr-10 ${errors.password ? 'border-red-500' : ''}`}
              placeholder="Create a password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="form-error">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              className={`input pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
              placeholder="Confirm your password"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: value =>
                  value === watchedPassword || 'Passwords do not match'
              })}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="form-error">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Global error */}
        {errors.root && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{errors.root.message}</p>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center space-x-2"
        >
          {loading ? (
            <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              <span>Create Account</span>
            </>
          )}
        </button>

        {/* Login link */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;
