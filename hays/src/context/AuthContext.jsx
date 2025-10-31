import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../utils/Toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!token);
  const [authLoading, setAuthLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  // Set default authorization header when token changes
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Fetch current user from backend
  const fetchUser = async (attempt = 0) => {
    if (!token) {
      setLoading(false);
      setUser(null);
      return;
    }

    try {
      const res = await api.get('/auth/users/me');
      setUser(res.data);
    } catch (error) {
      console.error('Failed to fetch user:', error.response?.data || error.message);

      if (!error.response) {
        // Network error or backend unreachable
        if (attempt < 3) {
          console.warn('Retrying user fetch in 1s...');
          setTimeout(() => fetchUser(attempt + 1), 1000);
          return;
        }
        toast.error('Cannot connect to server. Please make sure the backend is running.');
      } else if (error.response.status === 500) {
        toast.error('Server error while fetching user. Please try again later.');
      } else if (error.response.status === 401 || error.response.status === 403) {
        // Unauthorized or session expired
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        toast.info('Session expired. Please log in again.');
        navigate('/login');
      } else {
        toast.error('Failed to load user profile');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [token]);

  const login = async (credentials) => {
    setAuthLoading(true);
    try {
      const { data } = await api.post('/auth/login-with-username', {
        username: credentials.username,
        password: credentials.password,
      });

      const newToken = data?.access_token;
      if (!newToken) throw new Error('No access token received');

      // Store token and update state
      localStorage.setItem('token', newToken);
      setToken(newToken);

      // Fetch user after login
      await fetchUser();

      toast.success('Login successful!');
      navigate('/feed'); // immediate redirect to feed
      return user;
    } catch (e) {
      const errorMessage = e.response?.data?.detail || e.message || 'Login failed';
      toast.error(errorMessage);
      throw e;
    } finally {
      setAuthLoading(false);
    }
  };

  const register = async (payload) => {
    setAuthLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        username: payload.username,
        email: payload.email,
        password: payload.password,
      });

      if (data?.access_token) {
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
        toast.success('Registration successful!');
        await fetchUser();
        navigate('/feed');
      } else {
        toast.success('Registration successful, please login');
        navigate('/login');
      }

      return data;
    } catch (e) {
      const errorMessage = e.response?.data?.detail || e.message || 'Registration failed';
      if (e.response?.status === 400 && errorMessage.includes('already registered')) {
        toast.error('Email or username already exists');
      } else {
        toast.error(errorMessage);
      }
      throw e;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setAuthLoading(false);
    toast.info('Logged out');
    navigate('/login');
  };

  const updateUser = (userData) => setUser(userData);

  const value = useMemo(
    () => ({
      token,
      user,
      setUser: updateUser,
      loading,
      authLoading,
      login,
      register,
      logout,
      isAuthenticated: !!token && !!user,
    }),
    [token, user, loading, authLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
