import React, { createContext, useState, useCallback, ReactNode } from 'react';

interface User {
  _id: string;
  email: string;
  fullName: string;
  role: 'citizen' | 'police' | 'lawyer' | 'judge';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, role: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getApiUrl = () =>
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
      const response = await fetch(`${getApiUrl()}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(error.message);
      }

      const data = await response.json();
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'Failed to fetch' || msg.includes('fetch') || msg.includes('NetworkError')) {
        throw new Error('Cannot reach server. Make sure the backend is running (e.g. npm start in backend folder).');
      }
      throw err;
    }
  }, []);

  const register = useCallback(async (email: string, password: string, fullName: string, role: string) => {
    try {
      const response = await fetch(`${getApiUrl()}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, role }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Registration failed' }));
        throw new Error(error.message);
      }

      const data = await response.json();
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'Failed to fetch' || msg.includes('fetch') || msg.includes('NetworkError')) {
        throw new Error('Cannot reach server. Make sure the backend is running (e.g. npm start in backend folder).');
      }
      throw err;
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
