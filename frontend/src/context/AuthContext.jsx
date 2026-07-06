import React, { createContext, useState, useCallback, useEffect } from 'react';
import * as authService from '../services/authService';

export const AuthContext = createContext(undefined);

// authService.getMe() returns the raw API envelope ({success, message, id,
// email, name, createdAt}); normalize it to a consistent user shape so every
// caller (initial load, refreshUser) ends up with the same object.
function normalizeUser(userData) {
  return {
    id: userData.id,
    email: userData.email,
    name: userData.name,
    createdAt: userData.createdAt,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        try {
          const userData = await authService.getMe();
          setUser(normalizeUser(userData));
        } catch (error) {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setIsLoading(false);
    }

    checkAuth();
  }, []);

  const login = useCallback(
    async (email, password) => {
      try {
        const response = await authService.login(email, password);
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        setUser(response.user);
      } catch (error) {
        throw error;
      }
    },
    []
  );

  const register = useCallback(
    async (email, password, name) => {
      try {
        const response = await authService.register(email, password, name);
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        setUser(response.user);
      } catch (error) {
        throw error;
      }
    },
    []
  );

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await authService.getMe();
      setUser(normalizeUser(userData));
    } catch (error) {
      logout();
      throw error;
    }
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}




