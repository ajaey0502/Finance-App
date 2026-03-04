import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (serverError) {
      setServerError('');
    }
  }, [email, password]);

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateField = (field) => {
    const newErrors = { ...errors };

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
      } else {
        delete newErrors.password;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const isValid = validateField('all');
    setTouched({ email: true, password: true });

    if (!isValid) {
      return;
    }

    setIsLoading(true);
    setServerError('');

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Login failed. Please try again.';
      setServerError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = email && password && Object.keys(errors).length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">
            💰 FinSight
          </h1>
          <p className="text-gray-600 text-sm">Sign in to your account</p>
        </div>

        {serverError && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm font-medium flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              {serverError}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
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
            {touched.password && errors.password && (
              <p className="mt-1 text-sm text-red-600 font-medium">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading || !isFormValid}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="inline-block animate-spin">â³</span>
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-gray-500 text-sm">or</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        <p className="text-center text-gray-600 text-sm">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}




