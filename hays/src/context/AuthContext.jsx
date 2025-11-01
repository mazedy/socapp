import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useToast } from '../utils/Toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false); // don't block app; fetch user in background
  const [authLoading, setAuthLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const lastFetchRef = useRef(0);

  // Set default authorization header when token changes
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    const fetchUser = async (attempt = 0) => {
      // lightweight cache: skip if fetched in last 60s
      const now = Date.now();
      if (now - lastFetchRef.current < 60000) return;
      try {
        const res = await api.get('/auth/users/me');
        if (cancelled) return;
        lastFetchRef.current = now;
        setUser(res.data);
      } catch (error) {
        console.error('Failed to fetch user:', error);
        if (!error.response) {
          if (attempt < 2) {
            setTimeout(() => fetchUser(attempt + 1), 800);
            return;
          }
          if (!cancelled) toast.error('Cannot connect to server.');
        } else if (error.response.status === 401) {
          // token invalid
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
    };

    fetchUser();
    return () => { cancelled = true; };
  }, [token, toast]);

  // Sync auth state across tabs and avoid manual refresh needs
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'token') {
        setToken(e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const login = async (email, password) => {
    setAuthLoading(true);
    try {
      // Use FormData for OAuth2 compatibility (uses username field for both email/username)
      const formData = new FormData();
      formData.append('username', email); // Backend accepts email in username field
      formData.append('password', password);

      const { data } = await api.post('/auth/login', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const newToken = data?.access_token;

      if (!newToken) {
        throw new Error('No token received from server');
      }

      localStorage.setItem('token', newToken);
      setToken(newToken); // triggers background user fetch
      toast.success('Logged in successfully');
      return data; // caller will handle navigation
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
      // Backend expects: username, email, password
      const { data } = await api.post('/auth/register', {
        username: payload.username,
        email: payload.email,
        password: payload.password,
      });

      // If backend returns a token, sign in immediately; otherwise, redirect to login
      if (data?.access_token) {
        localStorage.setItem('token', data.access_token);
        setToken(data.access_token);
        toast.success('Registration successful!');
        navigate('/');
      } else {
        toast.success('Registration successful, please login');
        navigate('/login');
      }
      return data;
    } catch (e) {
      const errorMessage = e.response?.data?.detail || e.message || 'Registration failed';

      // Handle duplicate email/username error
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
    localStorage.removeItem('logged_in');
    setToken(null);
    setUser(null);
    setAuthLoading(false);
    toast.info('Logged out');
    navigate('/login', { replace: true });
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

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
      isAuthenticated: !!token,
    }),
    [token, user, loading, authLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
