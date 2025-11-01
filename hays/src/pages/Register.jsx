import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '@/api/axios';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    studentNumber: '',
    program: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = 'Email is invalid';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8)
      newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.studentNumber)
      newErrors.studentNumber = 'Student number is required';
    else if (!/^\d{2}-\d{5}$/.test(formData.studentNumber))
      newErrors.studentNumber =
        'Student number must be in format YY-XXXXX (e.g., 23-45678)';
    if (!formData.program.trim()) newErrors.program = 'Program is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const { confirmPassword, ...registrationData } = formData;
      const payload = {
        username: registrationData.username,
        email: registrationData.email,
        password: registrationData.password,
        student_number: registrationData.studentNumber,
        program: registrationData.program,
        bio: '',
      };

      await api.post('/auth/register', payload);

      setRegistrationSuccess(true);
      toast.success(
        'Account created successfully! Please check your email to verify your account.'
      );
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        studentNumber: '',
        program: '',
      });
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Registration failed. Please try again.';
      if (errorMessage.toLowerCase().includes('email'))
        setErrors((prev) => ({ ...prev, email: errorMessage }));
      else if (errorMessage.toLowerCase().includes('username'))
        setErrors((prev) => ({ ...prev, username: errorMessage }));
      else toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-orca-pale to-white p-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-orca-soft/30 p-8">
        <h1 className="text-3xl font-bold text-orca-navy text-center mb-6">
          Create Account
        </h1>

        {registrationSuccess ? (
          <div className="text-center space-y-4">
            <p className="text-green-700 font-medium">
              ✅ Account created! Please check your email to verify your account.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-orca-navy hover:bg-orca-ocean text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200"
            >
              Go to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username"
                className={`w-full p-3 rounded-lg border ${
                  errors.username ? 'border-red-500' : 'border-gray-300'
                } focus:ring-2 focus:ring-orca-ocean/50 focus:border-orca-ocean outline-none transition`}
              />
              {errors.username && (
                <p className="text-red-600 text-sm mt-1">{errors.username}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@gmail.com"
                className={`w-full p-3 rounded-lg border ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                } focus:ring-2 focus:ring-orca-ocean/50 focus:border-orca-ocean outline-none transition`}
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Student Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student Number
              </label>
              <input
                type="text"
                name="studentNumber"
                value={formData.studentNumber}
                onChange={handleChange}
                placeholder="23-45678"
                className={`w-full p-3 rounded-lg border ${
                  errors.studentNumber ? 'border-red-500' : 'border-gray-300'
                } focus:ring-2 focus:ring-orca-ocean/50 focus:border-orca-ocean outline-none transition`}
              />
              {errors.studentNumber && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.studentNumber}
                </p>
              )}
            </div>

            {/* Program */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Program
              </label>
              <input
                type="text"
                name="program"
                value={formData.program}
                onChange={handleChange}
                placeholder="Enter your program"
                className={`w-full p-3 rounded-lg border ${
                  errors.program ? 'border-red-500' : 'border-gray-300'
                } focus:ring-2 focus:ring-orca-ocean/50 focus:border-orca-ocean outline-none transition`}
              />
              {errors.program && (
                <p className="text-red-600 text-sm mt-1">{errors.program}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full p-3 rounded-lg border ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                } focus:ring-2 focus:ring-orca-ocean/50 focus:border-orca-ocean outline-none transition`}
              />
              {errors.password && (
                <p className="text-red-600 text-sm mt-1">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className={`w-full p-3 rounded-lg border ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                } focus:ring-2 focus:ring-orca-ocean/50 focus:border-orca-ocean outline-none transition`}
              />
              {errors.confirmPassword && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-orca-navy hover:bg-orca-ocean text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200 ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>

            <div className="text-center text-sm text-gray-500 pt-2">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-orca-ocean hover:text-orca-navy font-medium"
              >
                Sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
