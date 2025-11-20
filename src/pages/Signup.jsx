import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/SupabaseAuthContext";
import { supabase } from "../lib/supabaseClient";

export default function SignUp() {
  const { signUp } = useAuth();
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
      // Sign up user with Supabase Auth
      console.log("Creating account for:", formData.email);
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

      console.log("Account created, user ID:", result.user.id);

      // Wait a moment for auth to settle
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Create profile - Save to localStorage immediately, sync to DB in background
      const profileDataToSave = {
        user_id: result.user.id,
        username: formData.email.split("@")[0],
        full_name: formData.name.trim(),
        user_type: formData.userType,
        created_at: new Date().toISOString(),
      };

      // Save to localStorage immediately (always available)
      try {
        localStorage.setItem('user_profile', JSON.stringify(profileDataToSave));
        localStorage.setItem('pending_profile_sync', 'true');
        console.log("Saved profile to localStorage");
      } catch (localError) {
        console.error("Failed to save to localStorage:", localError);
      }

      // Try to sync to database in background (non-blocking)
      (async () => {
        try {
          const supabaseUrl = 'https://azvslusinlvnjymaufhw.supabase.co';
          const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6dnNsdXNpbmx2bmp5bWF1Zmh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NjYwNjYsImV4cCI6MjA3NTU0MjA2Nn0.4MdiznfE-UOdDn25X8XocML44UrCxpsJ2fIgvULevnw';
          
          // Get session token
          let authToken = supabaseKey;
          try {
            const sessionTimeout = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Session timeout')), 2000)
            );
            const { data: { session } } = await Promise.race([
              supabase.auth.getSession(),
              sessionTimeout
            ]);
            if (session?.access_token) {
              authToken = session.access_token;
            }
          } catch (e) {
            console.warn('Could not get session token, using anon key');
          }

          // Try to create profile with 3 second timeout
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile sync timeout')), 3000)
          );

          const response = await Promise.race([
            fetch(`${supabaseUrl}/rest/v1/profile`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${authToken}`,
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify(profileDataToSave)
            }),
            timeoutPromise
          ]);

          if (response.ok) {
            console.log("Profile synced to database successfully");
            localStorage.removeItem('pending_profile_sync');
          } else {
            const errorText = await response.text();
            console.warn("Profile sync failed (will retry later):", response.status, errorText);
            // Keep pending_profile_sync flag - will retry on next login
          }
        } catch (error) {
          console.warn("Profile sync failed (will retry later):", error.message);
          // Keep pending_profile_sync flag - will retry on next login
        }
      })();

      // Check if user was auto-logged in (happens when email confirmation is disabled)
      // Wait for auth context to update and profile to be available
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Get session with timeout
      let session = null;
      try {
        const sessionTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 3000)
        );
        const sessionPromise = supabase.auth.getSession();
        const { data } = await Promise.race([sessionPromise, sessionTimeout]);
        session = data?.session;
      } catch (e) {
        console.warn('Session check timed out:', e);
        // Continue anyway - user might need to log in manually
      }

      if (session && session.user) {
        console.log("User auto-logged in, redirecting based on role:", formData.userType);
        setLoading(false); // Clear loading state before redirect
        
        // Give a moment for profile to be available, then redirect
        // The app will handle role checking and show UserTypeModal if needed
        if (formData.userType === "seller") {
          navigate("/seller-dashboard", { replace: true });
        } else {
          navigate("/profile", { replace: true });
        }
        return; // Exit early after redirect
      } else {
        // Email confirmation required
        setLoading(false);
        alert(
          "Account created successfully! Please check your email to confirm your account. You can sign up again once confirmed."
        );
        navigate("/signup", { replace: true });
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
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 py-4 sm:py-6 lg:py-8 px-3 sm:px-4 lg:px-8 overflow-x-hidden mobile-container">
      <div className="max-w-md w-full space-y-4 sm:space-y-6 bg-white dark:bg-gray-800 p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-2xl border-4 border-white">
        <div className="text-center">
          <h2 className="text-center text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Create Account
          </h2>
        </div>

        <form className="space-y-3 sm:space-y-4 lg:space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded-lg text-sm break-words">
              {error}
            </div>
          )}

          <div className="space-y-3 sm:space-y-4">
            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                className={`appearance-none rounded-lg relative block w-full min-h-[44px] px-3 py-2 text-sm sm:text-base border ${
                  validationErrors.name
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-purple-500 focus:border-purple-500"
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:z-10`}
                placeholder="Enter your full name"
              />
              {validationErrors.name && (
                <p className="mt-1 text-xs sm:text-sm text-red-600">{validationErrors.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`appearance-none rounded-lg relative block w-full min-h-[44px] px-3 py-2 text-sm sm:text-base border ${
                  validationErrors.email
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-purple-500 focus:border-purple-500"
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:z-10`}
                placeholder="Enter your email"
              />
              {validationErrors.email && (
                <p className="mt-1 text-xs sm:text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`appearance-none rounded-lg relative block w-full min-h-[44px] px-3 py-2 text-sm sm:text-base border ${
                  validationErrors.password
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-purple-500 focus:border-purple-500"
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:z-10`}
                placeholder="Min. 6 characters"
              />
              {validationErrors.password && (
                <p className="mt-1 text-xs sm:text-sm text-red-600">{validationErrors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs sm:text-sm font-medium text-gray-700 mb-1"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`appearance-none rounded-lg relative block w-full min-h-[44px] px-3 py-2 text-sm sm:text-base border ${
                  validationErrors.confirmPassword
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-purple-500 focus:border-purple-500"
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:z-10`}
                placeholder="Confirm password"
              />
              {validationErrors.confirmPassword && (
                <p className="mt-1 text-xs sm:text-sm text-red-600">{validationErrors.confirmPassword}</p>
              )}
            </div>

            {/* User Type Selection */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                I am a:
              </label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 sm:space-x-3 cursor-pointer p-2.5 sm:p-3 border-2 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation">
                  <input
                    type="radio"
                    name="userType"
                    value="buyer"
                    checked={formData.userType === "buyer"}
                    onChange={handleChange}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm sm:text-base text-gray-900 font-medium">👤 Buyer</span>
                    <p className="text-xs text-gray-500">Purchase products</p>
                  </div>
                </label>
                <label className="flex items-center space-x-2 sm:space-x-3 cursor-pointer p-2.5 sm:p-3 border-2 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation">
                  <input
                    type="radio"
                    name="userType"
                    value="seller"
                    checked={formData.userType === "seller"}
                    onChange={handleChange}
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm sm:text-base text-gray-900 font-medium">🏪 Seller</span>
                    <p className="text-xs text-gray-500">Sell products</p>
                  </div>
                </label>
              </div>
              {validationErrors.userType && (
                <p className="mt-1 text-xs sm:text-sm text-red-600">{validationErrors.userType}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center min-h-[44px] py-2.5 sm:py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white touch-manipulation ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 shadow-lg"
              } transition-all`}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </div>

          <div className="text-xs text-center text-gray-500 px-2">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </div>
        </form>
      </div>
    </div>
  );
}
