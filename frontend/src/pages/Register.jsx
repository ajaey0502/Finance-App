import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  getPasswordStrength,
  getPasswordStrengthLabel,
  getPasswordStrengthColor,
} from '../utils/validation';

export function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Clear server error when form changes
  useEffect(() => {
    if (serverError) {
      setServerError('');
    }
  }, [name, email, password, confirmPassword]);

  // Real-time validation
  useEffect(() => {
    if (touched.password || touched.confirmPassword) {
      validateField('password');
      validateField('confirmPassword');
    }
  }, [password, confirmPassword]);

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateField = (field) => {
    const newErrors = { ...errors };

    if (field === 'name' || field === 'all') {
      if (!name || !name.trim()) {
        newErrors.name = 'Name is required';
      } else if (name.trim().length < 2) {
        newErrors.name = 'Name must be at least 2 characters';
      } else {
        delete newErrors.name;
      }
    }

    if (field === 'email' || field === 'all') {
      if (!email) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = 'Please enter a valid email address';
      } else {
        delete newErrors.email;
      }
    }

    if (field === 'password' || field === 'all') {
      if (!password) {
        newErrors.password = 'Password is required';
      } else if (password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
        newErrors.password =
          'Password must contain uppercase, lowercase, number, and special character';
      } else {
        delete newErrors.password;
      }
    }

    if (field === 'confirmPassword' || field === 'all') {
      if (!confirmPassword) {
        newErrors.confirmPassword = 'Password confirmation is required';
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      } else {
        delete newErrors.confirmPassword;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    const isValid = validateField('all');
    setTouched({ name: true, email: true, password: true, confirmPassword: true });

    if (!isValid) {
      return;
    }

    setIsLoading(true);
    setServerError('');

    try {
      await register(email, password, name);
      navigate('/');
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Registration failed. Please try again.';
      setServerError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(password);
  const passwordStrengthLabel = getPasswordStrengthLabel(passwordStrength);
  const passwordStrengthColor = getPasswordStrengthColor(passwordStrength);

  const isFormValid =
    name &&
    email &&
    password &&
    confirmPassword &&
    Object.keys(errors).length === 0 &&
    passwordStrength >= 2;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">
            💰 FinSight
          </h1>
          <p className="text-gray-600 text-sm">Create your account to get started</p>
        </div>

        {/* Server Error */}
        {serverError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm font-medium flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              {serverError}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name Field */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder=""
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleBlur('name')}
              disabled={isLoading}
              className={`w-full px-4 py-3 border-2 rounded-lg transition-colors ${
                touched.name && errors.name
                  ? 'border-red-300 bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500'
                  : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              } disabled:bg-gray-50 disabled:cursor-not-allowed`}
            />
            {touched.name && errors.name && (
              <p className="mt-1 text-sm text-red-600 font-medium">{errors.name}</p>
            )}
          </div>

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder=""
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur('email')}
              disabled={isLoading}
              className={`w-full px-4 py-3 border-2 rounded-lg transition-colors ${
                touched.email && errors.email
                  ? 'border-red-300 bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500'
                  : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              } disabled:bg-gray-50 disabled:cursor-not-allowed`}
            />
            {touched.email && errors.email && (
              <p className="mt-1 text-sm text-red-600 font-medium">{errors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                Password
              </label>
              {password && (
                <span className={`text-xs font-semibold ${passwordStrengthColor}`}>
                  {passwordStrengthLabel}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder=""
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => handleBlur('password')}
                disabled={isLoading}
                className={`w-full px-4 py-3 border-2 rounded-lg transition-colors ${
                  touched.password && errors.password
                    ? 'border-red-300 bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500'
                    : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                } disabled:bg-gray-50 disabled:cursor-not-allowed pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>

            {/* Password Strength Bar */}
            {password && (
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    passwordStrength === 0
                      ? 'w-1/4 bg-red-500'
                      : passwordStrength === 1
                        ? 'w-2/4 bg-orange-500'
                        : passwordStrength === 2
                          ? 'w-3/4 bg-yellow-500'
                          : passwordStrength === 3
                            ? 'w-4/4 bg-blue-500'
                            : 'w-full bg-green-500'
                  }`}
                />
              </div>
            )}

            {/* Password Requirements */}
            {password && touched.password && (
              <ul className="mt-3 text-xs space-y-1 text-gray-600">
                <li className={password.length >= 8 ? 'text-green-600' : ''}>
                  {password.length >= 8 ? '✓' : '○'} At least 8 characters
                </li>
                <li className={/[a-z]/.test(password) ? 'text-green-600' : ''}>
                  {/[a-z]/.test(password) ? '✓' : '○'} One lowercase letter
                </li>
                <li className={/[A-Z]/.test(password) ? 'text-green-600' : ''}>
                  {/[A-Z]/.test(password) ? '✓' : '○'} One uppercase letter
                </li>
                <li className={/\d/.test(password) ? 'text-green-600' : ''}>
                  {/\d/.test(password) ? '✓' : '○'} One number
                </li>
                <li className={/[@$!%*?&]/.test(password) ? 'text-green-600' : ''}>
                  {/[@$!%*?&]/.test(password) ? '✓' : '○'} One special character (@$!%*?&)
                </li>
              </ul>
            )}

            {touched.password && errors.password && (
              <p className="mt-2 text-sm text-red-600 font-medium">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder=""
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => handleBlur('confirmPassword')}
                disabled={isLoading}
                className={`w-full px-4 py-3 border-2 rounded-lg transition-colors ${
                  touched.confirmPassword && errors.confirmPassword
                    ? 'border-red-300 bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500'
                    : confirmPassword && password === confirmPassword
                      ? 'border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500'
                      : 'border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                } disabled:bg-gray-50 disabled:cursor-not-allowed pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {confirmPassword && password === confirmPassword && !touched.confirmPassword && (
              <p className="mt-1 text-sm text-green-600 font-medium">✓ Passwords match</p>
            )}
            {touched.confirmPassword && errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600 font-medium">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !isFormValid}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="inline-block animate-spin">â³</span>
                Creating account...
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-gray-500 text-sm">or</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* Login Link */}
        <p className="text-center text-gray-600 text-sm">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}




