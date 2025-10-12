// Imports
import React, { useState } from 'react';
import api from '@/api/axios';

const Login = () => {
  // States
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');

  // Handlers
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Use JSON login endpoint compatible with frontend
      const res = await api.post('/auth/login-with-username', formData);
      const token = res.data.access_token;
      localStorage.setItem('token', token);
      console.log('✅ Login success:', token);

      window.location.href = '/feed';
    } catch (err) {
      console.error('❌ Login error:', err);
      const msg = err.response?.data?.detail || 'Invalid username or password.';
      setError(msg);
    }
  };

  // UI Render — same as your design
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <form
        onSubmit={handleSubmit}
        className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-xl w-80"
      >
        <h2 className="text-white text-xl mb-4 text-center">Welcome Back</h2>

        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          className="w-full mb-3 p-2 rounded bg-white/20 text-white"
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="w-full mb-3 p-2 rounded bg-white/20 text-white"
          required
        />

        {error && <div className="text-red-400 text-sm mt-2">{error}</div>}

        <button
          type="submit"
          className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg shadow-lg transition"
        >
          Log In
        </button>
      </form>
    </div>
  );
};

export default Login;
