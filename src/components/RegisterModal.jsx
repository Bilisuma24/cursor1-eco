import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useAuth } from "../contexts/SupabaseAuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

export default function RegisterModal({ isOpen, onClose }) {
  const { signUp, signInWithOAuth } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (!formData.userType) {
      errors.userType = "Please select whether you're a buyer or seller";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setValidationErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await signUp(
        formData.email,
        formData.password,
        {
          name: formData.name.trim(),
          user_type: formData.userType,
        }
      );

      if (!result.user) {
        throw new Error("Account creation failed. Please try again.");
      }

      // Save profile to localStorage
      const profileDataToSave = {
        user_id: result.user.id,
        username: formData.email.split("@")[0],
        full_name: formData.name.trim(),
        user_type: formData.userType,
        created_at: new Date().toISOString(),
      };

      try {
        localStorage.setItem('user_profile', JSON.stringify(profileDataToSave));
        localStorage.setItem('pending_profile_sync', 'true');
      } catch (localError) {
        console.error("Failed to save to localStorage:", localError);
      }

      // Try to sync to database in background
      (async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const authToken = session?.access_token;
          
          await fetch(`${import.meta.env.VITE_SUPABASE_URL || 'https://azvslusinlvnjymaufhw.supabase.co'}/rest/v1/profile`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
              'Authorization': `Bearer ${authToken}`,
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify(profileDataToSave)
          });
        } catch (error) {
          console.warn("Profile sync failed (will retry later):", error.message);
        }
      })();

      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      let session = null;
      try {
        const { data } = await supabase.auth.getSession();
        session = data?.session;
      } catch (e) {
        console.warn('Session check failed:', e);
      }

      if (session && session.user) {
        setLoading(false);
        onClose();
        if (formData.userType === "seller") {
          navigate("/seller-dashboard", { replace: true });
        } else {
          navigate("/profile", { replace: true });
        }
        return;
      } else {
        setLoading(false);
        alert("Account created successfully! Please check your email to confirm your account.");
        onClose();
      }
    } catch (err) {
      console.error("Sign up error:", err);
      setError(err.message || "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Check if we're in a development environment
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      
      if (isLocalhost) {
        // For localhost, show a helpful message
        const confirmMessage = `To use Google sign-in, you need to:
1. Enable Google OAuth in your Supabase dashboard
2. Add ${window.location.origin}/auth/callback to allowed redirect URLs
3. Configure Google OAuth credentials in Supabase

Would you like to continue anyway?`;
        
        if (!window.confirm(confirmMessage)) {
          setLoading(false);
          return;
        }
      }
      
      await signInWithOAuth('google');
      // OAuth will redirect, so we don't need to close modal here
    } catch (err) {
      console.error("Google sign in error:", err);
      const errorMessage = err.message || "Failed to sign in with Google.";
      setError(`${errorMessage} Please make sure Google OAuth is configured in your Supabase dashboard.`);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-white z-[9999] overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="min-h-screen bg-white p-4 sm:p-6 lg:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-md mx-auto">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="pt-12 pb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Create Account</h2>

            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full mb-6 flex items-center justify-center gap-3 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Sign up with Google</span>
            </button>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                validationErrors.name
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="Enter your full name"
            />
            {validationErrors.name && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                validationErrors.email
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="Enter your email"
            />
            {validationErrors.email && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                validationErrors.password
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="Enter your password"
            />
            {validationErrors.password && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                validationErrors.confirmPassword
                  ? "border-red-300 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              placeholder="Confirm your password"
            />
            {validationErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              I am a
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="userType"
                  value="buyer"
                  checked={formData.userType === "buyer"}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Buyer</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="userType"
                  value="seller"
                  checked={formData.userType === "seller"}
                  onChange={handleChange}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Seller</span>
              </label>
            </div>
            {validationErrors.userType && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.userType}</p>
            )}
          </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating account..." : "Register"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

