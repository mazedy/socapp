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
        className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl shadow-xl w-80"
      >
        <h2 className="text-white text-xl mb-4 text-center">Create Account</h2>

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
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
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

        {error && <div className="text-red-400 mt-2 text-sm">{error}</div>}
        {success && <div className="text-green-400 mt-2 text-sm">{success}</div>}

        <button
          type="submit"
          className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg shadow-lg transition"
        >
          Register
        </button>
      </form>
    </div>
  );
};

export default Register;
