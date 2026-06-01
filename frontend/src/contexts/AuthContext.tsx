import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { seedDatabase } from '../services/db';

export interface UserRole {
  id: string;
  name: 'MIDWIFE' | 'NURSE' | 'PHYSICIAN' | 'GYNECOLOGIST' | 'MATERNITY_MANAGER' | 'SYSTEM_ADMIN' | 'DISTRICT_ADMIN';
}

export interface UserFacility {
  id: string;
  name: string;
  type: string;
}

export interface SessionUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  facility: UserFacility;
}

interface AuthContextType {
  user: SessionUser | null;
  loading: boolean;
  login: (email: string) => Promise<SessionUser>;
  logout: () => void;
  hasRole: (roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Seed Dexie database if it's empty
        await seedDatabase();

        // Restore user session from localStorage
        const storedUser = localStorage.getItem('partocare_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.error('Failed to initialize auth/db:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string): Promise<SessionUser> => {
    setLoading(true);
    try {
      const response = await apiService.login(email);
      const sessionUser: SessionUser = response.user;
      
      setUser(sessionUser);
      localStorage.setItem('partocare_user', JSON.stringify(sessionUser));
      localStorage.setItem('partocare_token', response.token);
      
      return sessionUser;
    } catch (err) {
      setLoading(false);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('partocare_user');
    localStorage.removeItem('partocare_token');
  };

  const hasRole = (allowedRoles: string[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role.name);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
};
