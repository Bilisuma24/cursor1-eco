import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";

export default function Login() {
  const { signIn, resendConfirmation, error: authError, user } = useSupabaseAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Handle successful login by watching user state
  useEffect(() => {
    if (user && loading) {
      console.log('User logged in successfully, navigating to profile');
      console.log('User data:', user);
      setLoginSuccess(true);
      setLoading(false);
      
      // Show success message briefly then navigate
      setTimeout(() => {
        console.log('Navigating to profile page');
        navigate("/profile");
      }, 1500);
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setLoginSuccess(false);
    
    try {
      console.log('Attempting to sign in with:', email);
      const result = await signIn(email, password);
      console.log('Sign in successful:', result);
      
      // The useEffect will handle navigation when user state updates
      
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err.message || "Login failed. Please check your credentials.");
      // Show resend button if email not confirmed
      if (err.message && err.message.includes('not confirmed')) {
        setShowResend(true);
      }
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendConfirmation(email);
      alert('Confirmation email sent! Please check your inbox.');
      setShowResend(false);
    } catch (err) {
      alert('Failed to send confirmation email: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 mb-4 w-full rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 mb-4 w-full rounded"
        />
        <button 
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded transition disabled:opacity-50 ${
            loginSuccess 
              ? 'bg-green-600 text-white' 
              : 'bg-emerald-600 text-white hover:brightness-110'
          }`}
        >
          {loginSuccess ? 'Login Successful! Redirecting...' : loading ? 'Logging in...' : 'Login'}
        </button>
        
        {loginSuccess && (
          <div className="mt-4 text-center">
            <p className="text-green-600 font-medium">✅ Login successful!</p>
            <p className="text-sm text-gray-600">Redirecting to your profile...</p>
          </div>
        )}
        {showResend && (
          <button 
            type="button"
            onClick={handleResend}
            className="mt-2 text-blue-600 text-sm w-full underline"
          >
            Resend confirmation email
          </button>
        )}
      </form>
    </div>
  );
}
