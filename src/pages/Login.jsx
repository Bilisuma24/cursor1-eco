import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, ShoppingBag, Heart, BellRing, Settings, Home } from "lucide-react";
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
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-md mx-auto px-4 py-4">
        {/* Profile Section - Matching Account Page Design */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-2xl font-semibold">
              <User className="w-10 h-10 text-gray-500" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Sign In / Register</h1>
            </div>
          </div>
        </div>

        {/* Profile Menu - Horizontal - Same as Account Page */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between gap-2 overflow-x-auto">
            <Link
              to="/login"
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg bg-orange-50 text-orange-600 font-medium min-w-[60px]"
            >
              <User className="w-5 h-5" />
              <span className="text-xs">Profile</span>
            </Link>
            <Link
              to="/orders"
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors min-w-[60px]"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="text-xs">Orders</span>
            </Link>
            <Link
              to="/wishlist"
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors min-w-[60px]"
            >
              <Heart className="w-5 h-5" />
              <span className="text-xs">Wishlist</span>
            </Link>
            <Link
              to="/price-alerts"
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors min-w-[60px]"
            >
              <BellRing className="w-5 h-5" />
              <span className="text-xs">Price Alerts</span>
            </Link>
            <Link
              to="/profile"
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors min-w-[60px]"
            >
              <Settings className="w-5 h-5" />
              <span className="text-xs">Settings</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
