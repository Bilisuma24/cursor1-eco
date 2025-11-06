import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check for error parameters in URL
        const errorParam = searchParams.get('error');
        const errorCode = searchParams.get('error_code');
        const errorDescription = searchParams.get('error_description');

        if (errorParam) {
          console.log('Auth callback error:', { errorParam, errorCode, errorDescription });
          
          // Handle specific error types
          if (errorCode === 'otp_expired') {
            setError({
              type: 'otp_expired',
              title: 'Email Link Expired',
              message: 'Your email confirmation link has expired. Please request a new one.',
              action: 'resend_confirmation'
            });
          } else if (errorCode === 'access_denied') {
            setError({
              type: 'access_denied',
              title: 'Access Denied',
              message: 'Access was denied. Please try again.',
              action: 'retry'
            });
          } else {
            setError({
              type: 'generic',
              title: 'Authentication Error',
              message: errorDescription || 'An error occurred during authentication.',
              action: 'retry'
            });
          }
          setLoading(false);
          return;
        }

        // Handle successful auth callback
        const { data, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
          console.error('Auth callback error:', authError);
          setError({
            type: 'session_error',
            title: 'Session Error',
            message: 'Failed to establish session. Please try logging in again.',
            action: 'retry'
          });
        } else if (data.session) {
          console.log('Auth callback successful, redirecting...');
          // Redirect to profile or dashboard based on user type
          navigate('/profile', { replace: true });
        } else {
          setError({
            type: 'no_session',
            title: 'No Session',
            message: 'No active session found. Please log in.',
            action: 'retry'
          });
        }
      } catch (err) {
        console.error('Auth callback exception:', err);
        setError({
          type: 'exception',
          title: 'Unexpected Error',
          message: 'An unexpected error occurred. Please try again.',
          action: 'retry'
        });
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate]);

  const handleResendConfirmation = async () => {
    try {
      const email = searchParams.get('email') || prompt('Please enter your email address:');
      if (!email) return;

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) {
        alert('Failed to resend confirmation email: ' + error.message);
      } else {
        alert('Confirmation email sent! Please check your inbox.');
        navigate('/login');
      }
    } catch (err) {
      alert('Failed to resend confirmation email: ' + err.message);
    }
  };

  const handleRetry = () => {
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Processing authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-md w-96 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{error.title}</h2>
          <p className="text-gray-600 mb-6">{error.message}</p>
          
          <div className="space-y-3">
            {error.action === 'resend_confirmation' && (
              <button
                onClick={handleResendConfirmation}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Resend Confirmation Email
              </button>
            )}
            
            {error.action === 'retry' && (
              <button
                onClick={handleRetry}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            )}
            
            <button
              onClick={() => navigate('/')}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
