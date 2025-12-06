import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, ShoppingBag, Heart, BellRing, Settings, Home, BarChart3 } from "lucide-react";
import { useAuth } from "../contexts/SupabaseAuthContext";
import { useUserRole } from "../hooks/useUserRole";
import UserTypeModal from "../components/UserTypeModal";
import LoginModal from "../components/LoginModal";
import RegisterModal from "../components/RegisterModal";

export default function Login() {
  const { user } = useAuth();
  const { userRole, isSeller, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [showUserTypeModal, setShowUserTypeModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

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
              <div className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors"
                >
                  Login
                </button>
                <span className="text-gray-400">/</span>
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors"
                >
                  Register
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
        <RegisterModal isOpen={showRegisterModal} onClose={() => setShowRegisterModal(false)} />

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
            {isSeller && (
              <Link
                to="/seller-dashboard"
                className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors min-w-[60px]"
              >
                <BarChart3 className="w-5 h-5" />
                <span className="text-xs">Dashboard</span>
              </Link>
            )}
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
              to="/settings"
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors min-w-[60px]"
            >
              <Settings className="w-5 h-5" />
              <span className="text-xs">Settings</span>
            </Link>
            <Link
              to="/price-alerts"
              className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors min-w-[60px]"
            >
              <BellRing className="w-5 h-5" />
              <span className="text-xs">Price Alerts</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
