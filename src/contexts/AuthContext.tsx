import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultUsers: User[] = [
  { id: '1', username: 'praful', password: 'praful', role: 'requestor', name: 'Praful Kumar' },
  { id: '2', username: 'cmk', password: 'cmk', role: 'cmk', name: 'Chandramauli Kumar' },
  { id: '3', username: 'ppc', password: 'ppc', role: 'ppc', name: 'PPC Team' },
  { id: '4', username: 'proc', password: 'proc', role: 'procurement', name: 'Procurement Team' },
  { id: '5', username: 'stores', password: 'stores', role: 'stores', name: 'Stores Team' },
  { id: '6', username: 'eval', password: 'eval', role: 'evaluation', name: 'Evaluation Team' },
  { id: '7', username: 'aarnav', password: 'aarnav', role: 'admin', name: 'Aarnav Admin' }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Initialize users in localStorage if not exists
    const existingUsers = localStorage.getItem('users');
    if (!existingUsers) {
      localStorage.setItem('users', JSON.stringify(defaultUsers));
    }

    // Check for existing session
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
    const foundUser = users.find(u => u.username === username && u.password === password);
    
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('currentUser', JSON.stringify(foundUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};