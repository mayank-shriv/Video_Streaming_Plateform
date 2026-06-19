import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('viewtube_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  // Verify auth state on mount
  useEffect(() => {
    const verifyAuth = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const res = await authService.getCurrentUser();
        const userData = res.data.data;
        setUser(userData);
        localStorage.setItem('viewtube_user', JSON.stringify(userData));
      } catch {
        // Token expired or invalid — clear state
        setUser(null);
        localStorage.removeItem('viewtube_user');
      } finally {
        setLoading(false);
      }
    };
    verifyAuth();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async (credentials) => {
    const res = await authService.login(credentials);
    const userData = res.data.data.user;
    setUser(userData);
    localStorage.setItem('viewtube_user', JSON.stringify(userData));
    return userData;
  }, []);

  const register = useCallback(async (formData) => {
    const res = await authService.register(formData);
    return res.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Logout even if API fails
    }
    setUser(null);
    localStorage.removeItem('viewtube_user');
  }, []);

  const updateUser = useCallback((updatedData) => {
    setUser((prev) => {
      const newUser = { ...prev, ...updatedData };
      localStorage.setItem('viewtube_user', JSON.stringify(newUser));
      return newUser;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, loading, login, register, logout, updateUser }}
    >
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
