import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('verifying');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/auth/verify-email`,
          { token }
        );
        setStatus('success');
        toast.success('Email verified successfully! You can now log in.');
        setTimeout(() => navigate('/login'), 3000);
      } catch (err) {
        console.error('Verification error:', err);
        setStatus('error');
        setError(
          err.response?.data?.detail ||
          'Failed to verify email. The link may have expired or is invalid.'
        );
      }
    };

    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setError('No verification token provided.');
    }
  }, [token, navigate]);

  const handleResend = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/resend-verification`,
        { email: searchParams.get('email') }
      );
      toast.success('Verification email resent! Check your inbox.');
    } catch (err) {
      console.error('Resend error:', err);
      toast.error(
        err.response?.data?.detail || 'Failed to resend verification email.'
      );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
        {status === 'verifying' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orca-navy mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-orca-navy mb-2">Verifying Your Email</h2>
            <p className="text-gray-600">Please wait while we verify your email address...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="bg-green-100 text-green-600 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Email Verified!</h2>
            <p className="text-gray-600 mb-6">Your email has been successfully verified. Redirecting to login...</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-orca-navy hover:bg-orca-ocean text-white py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Go to Login
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="bg-red-100 text-red-600 p-3 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            {searchParams.get('email') && (
              <button
                onClick={handleResend}
                className="w-full bg-orca-navy hover:bg-orca-ocean text-white py-2 px-4 rounded-lg transition-colors duration-200 mt-4"
              >
                Resend Verification Email
              </button>
            )}
            <button
              onClick={() => navigate('/register')}
              className="w-full mt-3 text-orca-navy hover:text-orca-ocean underline"
            >
              Back to Registration
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;
