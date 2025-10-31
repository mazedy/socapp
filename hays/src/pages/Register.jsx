// Imports  
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/api/axios';

const Register = () => {
  // States
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    studentNumber: '',
    program: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();

  // -------------------- HANDLE INPUT --------------------
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    setResendMessage('');
  };

  // -------------------- VALIDATION --------------------
  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';

    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    if (!formData.studentNumber) newErrors.studentNumber = 'Student number is required';
    else if (!/^\d{2}-\d{5}$/.test(formData.studentNumber))
      newErrors.studentNumber = 'Student number must be in format YY-XXXXX (e.g., 23-45678)';

    if (!formData.program.trim()) newErrors.program = 'Program is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // -------------------- HANDLE REGISTER --------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setResendMessage('');

    try {
      const { confirmPassword, ...registrationData } = formData;
      await api.post('/auth/register', registrationData);

      setRegistrationSuccess(true);
      setErrors({});
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.detail ||
                           error.response?.data?.message ||
                           'Registration failed. Please check your inputs and try again.';

      if (errorMessage.toLowerCase().includes('email')) {
        setErrors(prev => ({ ...prev, email: errorMessage }));
      } else if (errorMessage.toLowerCase().includes('username')) {
        setErrors(prev => ({ ...prev, username: errorMessage }));
      } else {
        setErrors(prev => ({ ...prev, general: errorMessage }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------- HANDLE RESEND VERIFICATION --------------------
  const handleResendVerification = async () => {
    if (!formData.email) {
      setResendMessage('⚠️ Please enter your email address first.');
      return;
    }

    setIsResending(true);
    setResendMessage('');

    try {
      const response = await api.post('/auth/resend-verification', {
        email: formData.email, // ✅ matches backend ResendVerificationRequest
      });

      setResendMessage(response.data.message || 'Verification email resent successfully!');
    } catch (error) {
      const errMsg = error.response?.data?.detail || '❌ Failed to resend verification email.';
      setResendMessage(errMsg);
    } finally {
      // Prevent spamming resend button
      setTimeout(() => setIsResending(false), 5000);
    }
  };

  // -------------------- UI --------------------
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-orca-pale to-white p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-orca-soft/30">
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-orca-navy">Create Account</h1>
              <p className="text-gray-500 mt-2">Join our community of CCS students</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full p-3 rounded-lg border ${errors.username ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-orca-ocean/50 focus:border-orca-ocean outline-none transition`}
                  placeholder="Enter your username"
                />
                {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full p-3 rounded-lg border ${errors.email ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-orca-ocean/50 focus:border-orca-ocean outline-none transition`}
                  placeholder="your.email@gmail.com"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              {/* Student Number */}
              <div>
                <label htmlFor="studentNumber" className="block text-sm font-medium text-gray-700 mb-1">Student Number</label>
                <input
                  type="text"
                  id="studentNumber"
                  name="studentNumber"
                  value={formData.studentNumber}
                  onChange={handleChange}
                  className={`w-full p-3 rounded-lg border ${errors.studentNumber ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-orca-ocean/50 focus:border-orca-ocean outline-none transition`}
                  placeholder="23-45678"
                />
                {errors.studentNumber && <p className="mt-1 text-sm text-red-600">{errors.studentNumber}</p>}
              </div>

              {/* Program */}
              <div>
                <label htmlFor="program" className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                <input
                  type="text"
                  id="program"
                  name="program"
                  value={formData.program}
                  onChange={handleChange}
                  className={`w-full p-3 rounded-lg border ${errors.program ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-orca-ocean/50 focus:border-orca-ocean outline-none transition`}
                  placeholder="Enter your program"
                />
                {errors.program && <p className="mt-1 text-sm text-red-600">{errors.program}</p>}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full p-3 rounded-lg border ${errors.password ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-orca-ocean/50 focus:border-orca-ocean outline-none transition`}
                  placeholder="••••••••"
                />
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full p-3 rounded-lg border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} focus:ring-2 focus:ring-orca-ocean/50 focus:border-orca-ocean outline-none transition`}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
              </div>

              {/* Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full bg-orca-navy hover:bg-orca-ocean text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </button>
              </div>

              {/* ✅ Success message */}
              {registrationSuccess && (
                <div className="mt-4 bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm text-center">
                  ✅ A verification link has been sent to <b>{formData.email}</b>. 
                  Please check your inbox or spam folder before logging in.
                  <div className="mt-2 text-xs">
                    Didn’t receive it?{' '}
                    <button
                      onClick={handleResendVerification}
                      type="button"
                      disabled={isResending}
                      className={`text-orca-ocean hover:text-orca-navy font-medium ${isResending ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isResending ? 'Resending...' : 'Resend Email'}
                    </button>
                  </div>
                  {resendMessage && (
                    <p className="mt-2 text-xs text-gray-600">
                      {resendMessage}
                    </p>
                  )}
                </div>
              )}

              {/* Login link */}
              <div className="text-center text-sm text-gray-500 pt-2">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-orca-ocean hover:text-orca-navy font-medium"
                >
                  Sign in
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-400">
          <p>By signing up, you agree to our Terms of Service and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
};

export default Register;
