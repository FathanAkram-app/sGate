'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, getAuthUser, getAuthToken, setAuthUser, setAuthToken, logout as logoutAuth } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load auth state from cookies on mount
    const savedUser = getAuthUser();
    const savedToken = getAuthToken();
    
    setUser(savedUser);
    setToken(savedToken);
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // For demo purposes, we'll create a mock login
      // In production, this would call your API
      const response = await mockLogin(email, password);
      
      setUser(response.user);
      setToken(response.token);
      setAuthUser(response.user);
      setAuthToken(response.token);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      // For demo purposes, we'll create a mock register
      // In production, this would call your API
      const response = await mockRegister(name, email, password);
      
      setUser(response.user);
      setToken(response.token);
      setAuthUser(response.user);
      setAuthToken(response.token);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    logoutAuth();
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      register,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Mock functions for demo - replace with real API calls
async function mockLogin(email: string, password: string) {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  if (email === 'demo@sgate.com' && password === 'demo123') {
    return {
      user: {
        id: '1',
        name: 'Demo User',
        email: 'demo@sgate.com'
      },
      token: 'demo_token_' + Date.now()
    };
  }
  
  throw new Error('Invalid credentials');
}

async function mockRegister(name: string, email: string, password: string) {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    user: {
      id: '2',
      name: name,
      email: email
    },
    token: 'demo_token_' + Date.now()
  };
}