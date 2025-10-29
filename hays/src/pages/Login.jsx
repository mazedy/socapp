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
        className="bg-orca-pale/80 backdrop-blur-lg p-6 rounded-2xl shadow-xl w-80 border border-orca-soft/20"
      >
        <h2 className="text-orca-navy text-2xl font-bold mb-4 text-center">Welcome Back</h2>

        <input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          className="w-full mb-3 p-2 rounded bg-white/90 text-orca-navy border border-orca-soft/50 focus:ring-2 focus:ring-orca-ocean/50 focus:border-orca-ocean outline-none transition"
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          className="w-full mb-3 p-2 rounded bg-white/90 text-orca-navy border border-orca-soft/50 focus:ring-2 focus:ring-orca-ocean/50 focus:border-orca-ocean outline-none transition"
          required
        />

        {error && <div className="text-red-400 text-sm mt-2">{error}</div>}

        <button
          type="submit"
          className="w-full mt-4 bg-orca-navy hover:bg-orca-ocean text-white py-2 rounded-lg shadow-lg transition-colors duration-200 font-medium"
        >
          Log In
        </button>
      </form>
    </div>
  );
};

export default Login;
