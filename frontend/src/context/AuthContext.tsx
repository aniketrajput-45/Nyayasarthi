import React, { createContext, useState, useCallback, ReactNode } from 'react';

interface User {
  _id: string;
  email: string;
  fullName: string;
  role: 'citizen' | 'police' | 'lawyer' | 'judge';
  address?: string;
  lat?: number;
  lng?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string, 
    password: string, 
    fullName: string, 
    role: string,
    phone: string,
    aadhaarNumber: string,
    badgeNumber?: string,
    licenseNumber?: string,
    courtAssignment?: string,
    specialization?: string,
    address?: string,
    lat?: number,
    lng?: number
  ) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Ensure we reach the backend correctly whether in dev or production
const getApiUrl = () => {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  return base.endsWith('/api') ? base : base.replace(/\/?$/, '') + '/api';
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });

  const login = useCallback(async (email: string, password: string) => {
    try {
      // 1. Send secure request to real backend
      const response = await fetch(`${getApiUrl()}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // 2. Save REAL user and JWT token from backend
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
    } catch (error: any) {
      throw new Error(error.message || 'Network error occurred. Is the backend running?');
    }
  }, []);

  const register = useCallback(async (
    email: string, 
    password: string, 
    fullName: string, 
    role: string,
    phone: string,
    aadhaarNumber: string,
    badgeNumber?: string,
    licenseNumber?: string,
    courtAssignment?: string,
    specialization?: string,
    address?: string,
    lat?: number,
    lng?: number
  ) => {
    try {
      // 1. Send secure request to real backend
      const response = await fetch(`${getApiUrl()}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          password, 
          fullName, 
          role,
          phone,
          aadhaarNumber,
          badgeNumber,
          licenseNumber,
          courtAssignment,
          specialization,
          address,
          lat,
          lng
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // 2. Save REAL user and JWT token from backend
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
    } catch (error: any) {
      throw new Error(error.message || 'Network error occurred. Is the backend running?');
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }, []);

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};