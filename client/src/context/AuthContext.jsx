import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  useEffect(() => {
    // Check if user is authenticated via session on mount
    const checkAuth = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/api/auth/me`, { withCredentials: true });
        setUser(data);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [API_URL]);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await axios.get(`${API_URL}/api/auth/logout`, { withCredentials: true });
    } catch (err) {
      console.error('Logout failed', err);
    }
    setUser(null);
    window.location.href = '/login';
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  // Computed role checks
  const isAdmin = user?.role === 'admin';
  const isAuthor = user?.role === 'author' || user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading, isAdmin, isAuthor }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
