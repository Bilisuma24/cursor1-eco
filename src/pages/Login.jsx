import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";

export default function Login() {
  const { signIn, resendConfirmation, error: authError } = useSupabaseAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      console.log('Attempting to sign in with:', email);
      const result = await signIn(email, password);
      console.log('Sign in successful:', result);
      
      // Wait a moment for session to be set
      await new Promise(resolve => setTimeout(resolve, 500));
      
      navigate("/profile");
      
      // Force reload to ensure auth state is updated
      window.location.href = "/profile";
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err.message || "Login failed. Please check your credentials.");
      // Show resend button if email not confirmed
      if (err.message && err.message.includes('not confirmed')) {
        setShowResend(true);
      }
    } finally {
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
          className="bg-emerald-600 text-white w-full py-2 rounded hover:brightness-110 transition disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
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
