// frontend/src/contexts/AuthContext.tsx
// Mirrors EduPath-SMS AuthContext — adapted for hospital roles

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { AuthUser, LoginCredentials, AuthResponse, Role } from '../types';
import { api } from '../utils/api';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
  isClinicalStaff: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'medipath_access_token';
const REFRESH_KEY = 'medipath_refresh_token';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setUser(null);
    // Optionally call backend logout
    api.post('/auth/logout').catch(() => {});
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const { data } = await api.get<AuthUser>('/auth/me');
      setUser(data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        // Try refresh
        const refreshToken = localStorage.getItem(REFRESH_KEY);
        if (refreshToken) {
          try {
            const { data } = await api.post<{ accessToken: string }>('/auth/refresh', { refreshToken });
            localStorage.setItem(TOKEN_KEY, data.accessToken);
            const { data: userData } = await api.get<AuthUser>('/auth/me');
            setUser(userData);
          } catch {
            logout();
          }
        } else {
          logout();
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (credentials: LoginCredentials) => {
    const { data } = await api.post<AuthResponse>('/auth/login', credentials);
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    localStorage.setItem(REFRESH_KEY, data.refreshToken);
    setUser(data.user);
  };

  const refreshUser = () => fetchCurrentUser();

  const hasRole = (...roles: Role[]) => {
    return user ? roles.includes(user.role) : false;
  };

  // Clinical staff = those who interact with patients clinically
  const isClinicalStaff = () => {
    return user ? ['DOCTOR', 'NURSE', 'LAB_TECHNICIAN', 'PHARMACIST'].includes(user.role) : false;
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      refreshUser,
      hasRole,
      isClinicalStaff,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
