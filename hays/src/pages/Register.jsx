// Imports
import React, { useState } from 'react';
import axios from 'axios';

const Register = () => {
  // States
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
    setSuccess('');

    try {
      const response = await axios.post(
         `${import.meta.env.VITE_API_URL}/auth/register`,
        formData
      );
      console.log('Registration success:', response.data);
      setSuccess('Registration successful! You can now log in.');
    } catch (error) {
      console.error('Registration error:', error);
    
      const message =
        error.response?.data?.detail ||
        error.response?.data?.msg ||
        'Registration failed. Please check your inputs.';
      setError(message);
    }
  }
  // UI Render (keep your existing form, just make sure inputs have name attributes)
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <form
        onSubmit={handleSubmit}
        className="bg-orca-pale/80 backdrop-blur-lg p-6 rounded-2xl shadow-xl w-80 border border-orca-soft/20"
      >
        <h2 className="text-orca-navy text-2xl font-bold mb-4 text-center">Create Account</h2>

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
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
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
          className="w-full mb-3 p-2 rounded bg-blue-600/90 text-orca-navy border border-orca-soft/50 focus:ring-2 focus:ring-orca-ocean/50 focus:border-orca-ocean outline-none transition"
          required
        />

        {error && <div className="text-red-500 mt-2 text-sm font-medium">{error}</div>}
        {success && <div className="text-green-600 mt-2 text-sm font-medium">{success}</div>}

        <button
          type="submit"
          className="w-full mt-4 bg-orca-navy hover:bg-orca-ocean text-white py-2 rounded-lg shadow-lg transition-colors duration-200 font-medium"
        >
          Register
        </button>
      </form>
    </div>
  );
};

export default Register;
