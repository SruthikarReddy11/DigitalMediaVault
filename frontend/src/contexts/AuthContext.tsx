import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { authApi } from '../services/authApi';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (data: { identifier: string; password: string }) => Promise<void>;
  register: (data: {
    name: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    mobileNumber?: string | null;
    gender?: string | null;
    dob?: string | null;
    country?: string | null;
    state?: string | null;
    district?: string | null;
    village?: string | null;
    pincode?: string | null;
    occupation?: string | null;
  }) => Promise<{ user: User; token: string; securityPin?: string }>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<User | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getInitialUser = (): User | null => {
  try {
    const cached = localStorage.getItem('pdl_user_cache');
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(getInitialUser);
  const [isLoading, setIsLoading] = useState<boolean>(() => !getInitialUser());

  const saveUserToCache = (u: User | null) => {
    if (u) {
      try {
        localStorage.setItem('pdl_user_cache', JSON.stringify(u));
      } catch (err) {
        console.warn('Failed to cache user:', err);
      }
    } else {
      localStorage.removeItem('pdl_user_cache');
    }
  };

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await authApi.getMe();
      if (currentUser) {
        setUser(currentUser);
        saveUserToCache(currentUser);
      }
      return currentUser;
    } catch (err: any) {
      console.warn('Failed to refresh user:', err);
      if (err?.status === 401) {
        localStorage.removeItem('pdl_auth_token');
        saveUserToCache(null);
        setUser(null);
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (data: { identifier: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(data);
      if (res.token) {
        localStorage.setItem('pdl_auth_token', res.token);
      }
      setUser(res.user);
      saveUserToCache(res.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: {
    name: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    mobileNumber?: string | null;
    gender?: string | null;
    dob?: string | null;
    country?: string | null;
    state?: string | null;
    district?: string | null;
    village?: string | null;
    pincode?: string | null;
    occupation?: string | null;
  }) => {
    setIsLoading(true);
    try {
      const res = await authApi.register(data);
      if (res.token) {
        localStorage.setItem('pdl_auth_token', res.token);
      }
      setUser(res.user);
      saveUserToCache(res.user);
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem('pdl_auth_token');
      saveUserToCache(null);
      setUser(null);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser((prev) => {
      const merged = prev ? { ...prev, ...updatedUser } : updatedUser;
      saveUserToCache(merged);
      return merged;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        login,
        register,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { useAuth } from './useAuth';
