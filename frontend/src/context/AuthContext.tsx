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

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token');
  });

  const login = useCallback(async (email: string, password: string) => {
    // 1. Get our "database" of users from local storage
    const storedUsers = localStorage.getItem('app_users');
    const allUsers = storedUsers ? JSON.parse(storedUsers) : [];

    // 2. Find a user that matches the email and password
    const foundUser = allUsers.find((u: any) => u.email === email && u.password === password);

    if (!foundUser) {
      throw new Error('Invalid email or password');
    }

    // 3. Remove the password before saving to state
    const { password: _, ...userWithoutPassword } = foundUser;
    
    // 4. Create a fake token to keep the app happy
    const fakeToken = 'mock-jwt-token-' + Date.now();

    // 5. Log the user in
    setUser(userWithoutPassword as User);
    setToken(fakeToken);
    localStorage.setItem('user', JSON.stringify(userWithoutPassword));
    localStorage.setItem('token', fakeToken);
    
    // Very Important: Set studentId for your profile and chat pages!
    localStorage.setItem('studentId', foundUser._id);
  }, []);

  const register = useCallback(async (email: string, password: string, fullName: string, role: string) => {
    // 1. Get our "database" of users from local storage
    const storedUsers = localStorage.getItem('app_users');
    const allUsers = storedUsers ? JSON.parse(storedUsers) : [];

    // 2. Check if email is already taken
    const emailExists = allUsers.some((u: any) => u.email === email);
    if (emailExists) {
      throw new Error('An account with this email already exists.');
    }

    // 3. Create a new user object
    const newUser = {
      _id: 'user_' + Date.now(),
      email,
      password,
      fullName,
      role: role as 'citizen' | 'police' | 'lawyer' | 'judge'
    };

    // 4. Save to our local storage "database" array
    allUsers.push(newUser);
    localStorage.setItem('app_users', JSON.stringify(allUsers));

    // 5. Automatically log the new user in
    const { password: _, ...userWithoutPassword } = newUser;
    const fakeToken = 'mock-jwt-token-' + Date.now();

    setUser(userWithoutPassword as User);
    setToken(fakeToken);
    localStorage.setItem('user', JSON.stringify(userWithoutPassword));
    localStorage.setItem('token', fakeToken);
    
    // Very Important: Set studentId for your profile and chat pages!
    localStorage.setItem('studentId', newUser._id);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('studentId'); // Clear this out on logout
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