import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '@/api/axios';
import { useAuth } from '@/context/AuthContext';

export default function Login() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Use AuthContext to set token instantly; it returns data when done
      await login(formData.username, formData.password);

      toast.success('Login successful!');
      const redirectTo = location.state?.from?.pathname || '/feed';
      setTimeout(() => navigate(redirectTo, { replace: true }), 0);

    } catch (error) {
      console.error('Login error:', error);

      // Handle email verification error
      const detail = error.response?.data?.detail || error.response?.data?.message;
      if (detail?.toLowerCase().includes('verify')) {
        toast.warning('Please verify your email before logging in.');
      } else if (error.response?.status === 400) {
        toast.error('Invalid username or password.');
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-orca-pale to-white p-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-orca-soft/30 p-8">
        <h1 className="text-3xl font-bold text-orca-navy text-center mb-6">Welcome Back</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              required
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orca-ocean/50 focus:border-orca-ocean outline-none transition"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
              className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orca-ocean/50 focus:border-orca-ocean outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full bg-orca-navy hover:bg-orca-ocean text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="text-center text-sm text-gray-500 pt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-orca-ocean hover:text-orca-navy font-medium">Sign up</Link>
        </div>
      </div>
    </div>
  );
}
