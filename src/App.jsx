import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { Search, Heart, User, ChevronDown, Globe, MapPin, LogOut, ChevronUp } from "lucide-react";
import { useState, useContext, useEffect, useRef } from "react";
import productsData from "./data/products.js";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import About from "./pages/About";
import Contact from "./pages/Contact";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import Profile from "./pages/profile";
import Account from "./pages/Account";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import ProductDetail from "./pages/ProductDetail";
import Wishlist from "./pages/Wishlist";
import PriceAlerts from "./pages/PriceAlerts";
import SellerDashboard from "./pages/SellerDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AuthCallback from "./pages/auth/AuthCallback";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ScrollToTop from "./components/ScrollToTop";
import BottomNavigation from "./components/BottomNavigation";
import ImageTest from "./components/ImageTest";
import ImageDebug from "./components/ImageDebug";
import ImageTestSimple from "./components/ImageTestSimple";
import CartTest from "./components/CartTest";
import SimpleCartTest from "./components/SimpleCartTest";

import { CartProvider, useCart } from "./contexts/CartContext";
import { SupabaseAuthProvider, useAuth } from "./contexts/SupabaseAuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { useUserRole } from "./hooks/useUserRole";
import { PublicRoute } from "./components/ProtectedRoute";

function NavbarContent() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { userRole, isSeller, isAdmin, loading: roleLoading } = useUserRole();
  const { wishlist } = useCart();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const dropdownRef = useRef(null);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set("search", searchTerm);
    if (searchCategory) params.set("category", searchCategory);
    const qs = params.toString();
    window.location.href = `/shop${qs ? `?${qs}` : ""}`;
  };

  const toggleUserDropdown = () => setUserDropdownOpen(!userDropdownOpen);

  const handleLogout = async () => {
    await signOut();
    setUserDropdownOpen(false);
    window.location.href = "/login";
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.user_metadata?.name) {
      return user.user_metadata.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const getUserDisplayName = () => {
    return user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  };

  const getAvatarUrl = () => user?.user_metadata?.avatar_url || "";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      {/* RESPONSIVE FIX: Improved padding */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Top Bar - RESPONSIVE: Hide or simplify on mobile */}
        <div className="hidden sm:flex items-center justify-between py-2 text-xs text-gray-600">
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /><span>Ship to</span><span className="font-medium text-gray-800">United States</span></div>
            <div className="hidden md:flex items-center gap-1"><Globe className="w-3.5 h-3.5" /><span>English</span><ChevronDown className="w-3 h-3" /></div>
            <span className="hidden lg:inline">Trade Assurance</span>
            <span className="hidden xl:inline">Secure payments</span>
          </div>
          <div className="flex items-center gap-3 lg:gap-4">
            <span className="hidden md:inline">Help</span>
            <span className="hidden lg:inline">Buyer Protection</span>
            <span className="hidden xl:inline">App</span>
          </div>
        </div>

        {/* Main Navigation - RESPONSIVE: Improved spacing */}
        <div className="flex items-center justify-between py-3 sm:py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">E</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">Eco Store</span>
          </Link>

          {/* Search Bar - RESPONSIVE: Improved mobile layout */}
          <div className="hidden sm:flex flex-1 max-w-3xl mx-3 lg:mx-6">
            <form onSubmit={handleSearch} className="flex w-full">
              <div className="hidden lg:block">
                <select
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  className="h-[42px] sm:h-[44px] border border-r-0 border-gray-300 rounded-l-lg px-3 text-xs sm:text-sm bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {productsData.categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder="Search for products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 sm:pl-10 pr-20 sm:pr-28 h-[40px] sm:h-[44px] border border-gray-300 lg:border-l-0 rounded-l-lg lg:rounded-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1/2 -translate-y-1/2 bg-orange-500 hover:bg-orange-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium"
                >
                  Search
                </button>
              </div>
            </form>
            <div className="hidden lg:flex gap-3 text-xs text-gray-500 mt-2">
              <span className="hover:text-gray-700 cursor-pointer">Top deals</span>
              <span className="hover:text-gray-700 cursor-pointer">New arrivals</span>
              <span className="hover:text-gray-700 cursor-pointer">Free shipping</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-orange-600 font-medium">
              Home
            </Link>
            <Link to="/shop" className="text-gray-700 hover:text-orange-600 font-medium">
              Shop
            </Link>
            <Link to="/about" className="text-gray-700 hover:text-orange-600 font-medium">
              About
            </Link>
            <Link to="/contact" className="text-gray-700 hover:text-orange-600 font-medium">
              Contact
            </Link>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Wishlist */}
            <Link to="/wishlist" className="relative p-2 text-gray-700 hover:text-red-600 transition-colors duration-200">
              <Heart className="w-6 h-6" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {!user ? (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-orange-600 font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors duration-200 font-medium"
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className="relative flex items-center gap-2" ref={dropdownRef}>
                {/* Mobile: Profile icon directly links to profile */}
                <Link
                  to="/profile"
                  className="lg:hidden flex items-center text-gray-700 dark:text-gray-300 hover:text-orange-600 transition-colors"
                  title="Profile"
                >
                  {getAvatarUrl() ? (
                    <img src={getAvatarUrl()} alt="Avatar" className="w-8 h-8 rounded-full object-cover border" />
                  ) : (
                    <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                      {getUserInitials()}
                    </div>
                  )}
                </Link>
                
                {/* Desktop: Profile with dropdown */}
                <div className="hidden lg:flex items-center space-x-2">
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-orange-600 transition-colors"
                    title="Profile"
                  >
                    {getAvatarUrl() ? (
                      <img src={getAvatarUrl()} alt="Avatar" className="w-8 h-8 rounded-full object-cover border" />
                    ) : (
                      <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        {getUserInitials()}
                      </div>
                    )}
                    <span className="font-medium">{getUserDisplayName()}</span>
                  </Link>
                  <button
                    onClick={toggleUserDropdown}
                    aria-label="Open menu"
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                
                {/* User Dropdown (Desktop only) */}
                {userDropdownOpen && (
                  <div className="hidden lg:block absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>
                    <Link
                      to="/orders"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                    >
                      <span>Orders</span>
                    </Link>
                    {isSeller && (
                      <Link
                        to="/seller-dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                      >
                        <span>Seller Dashboard</span>
                      </Link>
                    )}
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                      >
                        <span>Admin Dashboard</span>
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-50"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

function FooterContent() {
  return (
    <footer className="bg-gray-900 mt-auto">
      <div className="max-w-7xl mx-auto px-2 sm:px-3 py-1.5">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-1.5">
          {/* Quick Links */}
          <div>
            <h3 className="text-[8px] font-semibold text-white mb-0.5">Quick Links</h3>
            <ul className="space-y-0">
              <li><Link to="/" className="text-[8px] text-gray-400 hover:text-white transition-colors leading-tight">Home</Link></li>
              <li><Link to="/shop" className="text-[8px] text-gray-400 hover:text-white transition-colors leading-tight">Shop</Link></li>
              <li><Link to="/about" className="text-[8px] text-gray-400 hover:text-white transition-colors leading-tight">About</Link></li>
              <li><Link to="/contact" className="text-[8px] text-gray-400 hover:text-white transition-colors leading-tight">Contact</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-[8px] font-semibold text-white mb-0.5">Support</h3>
            <ul className="space-y-0">
              <li><Link to="/orders" className="text-[8px] text-gray-400 hover:text-white transition-colors leading-tight">My Orders</Link></li>
              <li><Link to="/wishlist" className="text-[8px] text-gray-400 hover:text-white transition-colors leading-tight">Wishlist</Link></li>
              <li><a href="#" className="text-[8px] text-gray-400 hover:text-white transition-colors leading-tight">Help Center</a></li>
              <li><a href="#" className="text-[8px] text-gray-400 hover:text-white transition-colors leading-tight">Returns</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-[7px] font-medium text-white mb-0">Legal</h3>
            <ul className="space-y-0 leading-tight">
              <li><a href="#" className="text-[7px] text-gray-400 hover:text-white transition-colors">Privacy</a></li>
              <li><a href="#" className="text-[7px] text-gray-400 hover:text-white transition-colors">Terms</a></li>
              <li><a href="#" className="text-[7px] text-gray-400 hover:text-white transition-colors">Cookies</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-[7px] font-medium text-white mb-0">Contact</h3>
            <ul className="space-y-0 leading-tight">
              <li><a href="mailto:support@ecoshop.com" className="text-[7px] text-gray-400 hover:text-white transition-colors">support@ecoshop.com</a></li>
              <li><a href="tel:+1800ECOSHOP" className="text-[7px] text-gray-400 hover:text-white transition-colors">1-800-ECO-SHOP</a></li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-gray-800 pt-1">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-1.5">
            <p className="text-[8px] text-gray-400">© {new Date().getFullYear()} EcoShop. All rights reserved.</p>
            <div className="flex gap-1.5">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Facebook</span>
                <span className="text-[10px]">f</span>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Twitter</span>
                <span className="text-[10px]">t</span>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Instagram</span>
                <span className="text-[10px]">i</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function AppContent() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isProductDetailPage = location.pathname.startsWith('/product/');

  return (
    <>
      <ScrollToTop />
      {/* Header - Logo always visible, rest only on home page */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        {isHomePage ? (
          <NavbarContent />
        ) : isProductDetailPage ? (
          // No header on product detail page
          null
        ) : (
          <div className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
              <div className="flex items-center justify-between py-3 sm:py-4">
                {/* Logo - Always visible */}
                <Link to="/" className="flex items-center space-x-2">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xl">E</span>
                  </div>
                  <span className="text-2xl font-bold text-gray-900">Eco Store</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Page Routes */}
      <main>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              
              {/* Auth Routes - Redirect if already logged in */}
              <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              
              {/* Protected Routes */}
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/price-alerts" element={<PriceAlerts />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/account" element={<Account />} />
              <Route path="/seller-dashboard/*" element={<SellerDashboard />} />
              <Route path="/admin/*" element={<AdminDashboard />} />
              
              {/* Test/Dev Routes */}
              <Route path="/test" element={<ImageTest />} />
              <Route path="/debug" element={<ImageDebug />} />
              <Route path="/simple" element={<ImageTestSimple />} />
              <Route path="/cart-test" element={<CartTest />} />
              <Route path="/simple-cart-test" element={<SimpleCartTest />} />
            </Routes>
      </main>

      {/* Mobile Bottom Navigation - Global */}
      <BottomNavigation />

      {/* Footer - Only on home page */}
      {isHomePage && <FooterContent />}
    </>
  );
}

function App() {
  // Wrap Router with providers here so NavbarContent can access Supabase auth
  return (
    <SupabaseAuthProvider>
      <CartProvider>
        <ToastProvider>
          <Router>
            <AppContent />
          </Router>
        </ToastProvider>
      </CartProvider>
    </SupabaseAuthProvider>
  );
}

export default App;
