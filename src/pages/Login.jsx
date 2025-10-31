import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/SupabaseAuthContext";
import { useUserRole } from "../hooks/useUserRole";
import UserTypeModal from "../components/UserTypeModal";

export default function Login() {
  const { signIn, resendConfirmation, user } = useAuth();
  const { userRole, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showUserTypeModal, setShowUserTypeModal] = useState(false);

  // Check if user needs to select role and redirect if they have one
  useEffect(() => {
    if (user && !roleLoading) {
      if (userRole) {
        // User has a role - redirect based on role
        if (userRole === "seller") {
          navigate("/seller-dashboard", { replace: true });
        } else if (userRole === "buyer") {
          navigate("/profile", { replace: true });
        }
      } else {
        // User logged in but no role (null or undefined) - show modal
        console.log('User has no role, showing role selection modal');
        setShowUserTypeModal(true);
      }
    }
  }, [user, userRole, roleLoading, navigate]);

  // Load remembered email from localStorage
  useEffect(() => {
    const rememberedEmail = localStorage.getItem("remembered_email");
    if (rememberedEmail) {
      setFormData((prev) => ({ ...prev, email: rememberedEmail, rememberMe: true }));
    }
  }, []);

  const validateForm = () => {
    const errors = {};

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setValidationErrors({});
    setShowResend(false);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      console.log("Attempting to sign in with:", formData.email);
      await signIn(formData.email, formData.password);

      // Handle remember me
      if (formData.rememberMe) {
        localStorage.setItem("remembered_email", formData.email);
      } else {
        localStorage.removeItem("remembered_email");
      }

      // Wait for user state and role to update
      // The redirect/modal will happen in the useEffect above
      console.log("Login successful, waiting for role determination...");
      setLoading(false);
    } catch (err) {
      console.error("Sign in error:", err);
      const errorMessage = err.message || "Login failed. Please check your credentials.";

      setError(errorMessage);

      // Show resend button if email not confirmed
      if (errorMessage.toLowerCase().includes("not confirmed") || errorMessage.toLowerCase().includes("email")) {
        setShowResend(true);
      }

      setLoading(false);
    }
  };

  const handleRoleSelected = (selectedRole) => {
    console.log('Role selected:', selectedRole);
    setShowUserTypeModal(false);
    // Small delay to ensure profile is created
    setTimeout(() => {
      if (selectedRole === "seller") {
        navigate("/seller-dashboard", { replace: true });
      } else {
        navigate("/profile", { replace: true });
      }
    }, 500);
  };

  const handleResend = async () => {
    try {
      await resendConfirmation(formData.email);
      alert("Confirmation email sent! Please check your inbox.");
      setShowResend(false);
    } catch (err) {
      alert("Failed to send confirmation email: " + err.message);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Clear general error when user starts typing
    if (error) {
      setError("");
    }
  };

  // Show user type modal if user is logged in but has no role
  if (showUserTypeModal && user) {
    return <UserTypeModal user={user} onComplete={handleRoleSelected} />;
  }

  // Show loading while checking auth state or role (only if user exists)
  if (user && roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500">
              Sign up
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex items-start">
                <svg
                  className="h-5 w-5 mr-2 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <p>{error}</p>
                  {showResend && (
                    <button
                      type="button"
                      onClick={handleResend}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Resend confirmation email
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className={`appearance-none rounded-lg relative block w-full px-3 py-2 border ${
                  validationErrors.email
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:z-10 sm:text-sm`}
                placeholder="Enter your email"
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                className={`appearance-none rounded-lg relative block w-full px-3 py-2 border ${
                  validationErrors.password
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:z-10 sm:text-sm`}
                placeholder="Enter your password"
              />
              {validationErrors.password && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
              )}
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center">
            <input
              id="rememberMe"
              name="rememberMe"
              type="checkbox"
              checked={formData.rememberMe}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-900">
              Remember me
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              } transition-colors`}
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
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
