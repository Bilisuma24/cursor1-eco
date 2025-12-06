import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { Search, Heart, User, ChevronDown, Globe, MapPin, LogOut, ChevronUp, ShoppingCart, Menu, Camera, Mic, QrCode, ChevronRight } from "lucide-react";
import { useState, useContext, useEffect, useRef } from "react";
import productsData from "./data/products.js";
import Logo from "./components/Logo";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import About from "./pages/About";
import Contact from "./pages/Contact";
import StoreProfile from "./pages/StoreProfile";
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
import Settings from "./pages/Settings";
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
import ErrorBoundary from "./components/ErrorBoundary";

import { CartProvider, useCart } from "./contexts/CartContext";
import { SupabaseAuthProvider, useAuth } from "./contexts/SupabaseAuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { useUserRole } from "./hooks/useUserRole";
import { PublicRoute } from "./components/ProtectedRoute";

function NavbarContent() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { userRole, isSeller, isAdmin, loading: roleLoading } = useUserRole();
  const { wishlist, getCartItemsCount } = useCart();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCategory, setSearchCategory] = useState("");
  const dropdownRef = useRef(null);
  const cartItemsCount = typeof getCartItemsCount === "function" ? getCartItemsCount() : 0;

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
      {/* Desktop layout */}
      <div className="hidden lg:block">
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-8">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 min-w-[180px]">
              <Logo className="w-12 h-12" />
              <div className="flex flex-col items-start">
                <span className="text-2xl text-[#3b82f6] leading-none font-bold">Kush deals</span>
                <span className="text-xs uppercase tracking-[0.2em] text-[#ff6a3c] font-semibold">MARKETSPACE</span>
              </div>
            </Link>

            {/* Search + quick tools */}
            <div className="flex-1 flex flex-col justify-center items-center gap-1">
              <form onSubmit={handleSearch} className="w-full max-w-xl">
                <div className="flex items-stretch border border-[#ff4747] rounded-full overflow-hidden bg-white shadow-sm">
                  <select
                    value={searchCategory}
                    onChange={(e) => setSearchCategory(e.target.value)}
                    className="hidden xl:block w-28 bg-gray-100 text-sm text-gray-600 px-3 focus:outline-none focus:ring-0 border-r border-gray-200"
                  >
                    <option value="">All Categories</option>
                    {productsData.categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search for great deals, products, and trends"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-28 h-9 text-sm text-gray-700 focus:outline-none"
                    />
                    <div className="absolute right-24 top-1/2 -translate-y-1/2 flex items-center gap-1 text-gray-400">
                      <button type="button" className="p-1 hover:text-[#ff4747] transition-colors" title="Image search">
                        <Camera className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" className="p-1 hover:text-[#ff4747] transition-colors" title="Voice search">
                        <Mic className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      type="submit"
                      className="absolute right-1 top-1/2 -translate-y-1/2 bg-[#ff4747] hover:bg-[#ff2e2e] transition-colors text-white font-semibold uppercase text-[11px] px-4 py-1.5 rounded-full"
                    >
                      Search
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-6 text-sm text-gray-700">
              <div ref={dropdownRef} className="relative">
                {user ? (
                  <button
                    type="button"
                    onClick={toggleUserDropdown}
                    className="flex items-center gap-2 hover:text-[#ff4747] transition-colors"
                  >
                    {getAvatarUrl() ? (
                      <img src={getAvatarUrl()} alt="Avatar" className="w-9 h-9 rounded-full object-cover border border-gray-200" />
                    ) : (
                      <div className="w-9 h-9 bg-[#ff4747] text-white rounded-full flex items-center justify-center text-sm font-semibold">
                        {getUserInitials()}
                      </div>
                    )}
                    <div className="flex flex-col items-start">
                      <span className="text-[11px] text-gray-500 leading-none">Hi,</span>
                      <span className="text-sm font-semibold leading-tight">{getUserDisplayName()}</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>
                ) : (
                  <div className="flex flex-col text-xs text-gray-500 text-right">
                    <span className="font-medium text-gray-700">Welcome</span>
                    <div className="flex items-center gap-2 mt-1 text-[#ff4747]">
                      <Link to="/login" className="font-semibold hover:underline cursor-pointer">Login</Link>
                      <span className="text-gray-300">|</span>
                      <Link to="/signup" className="font-semibold hover:underline cursor-pointer">Register</Link>
                    </div>
                  </div>
                )}
                {user && userDropdownOpen && (
                  <div className="absolute right-0 top-full mt-3 w-60 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{getUserDisplayName()}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <User className="w-4 h-4" />
                        <span>Profile</span>
                      </Link>
                      <Link
                        to="/orders"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <span>Orders</span>
                      </Link>
                      {isSeller && (
                        <Link
                          to="/seller-dashboard"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <span>Seller Dashboard</span>
                        </Link>
                      )}
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <span>Admin Dashboard</span>
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-gray-100">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-[#ff4747] font-semibold hover:bg-[#fff1ed]"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <Link to="/cart" className="relative flex flex-col items-center gap-1 hover:text-[#ff4747] transition-colors">
                <ShoppingCart className="w-6 h-6" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-[#ff4747] text-white text-[10px] font-semibold rounded-full px-1.5 py-0.5">
                    {cartItemsCount}
                  </span>
                )}
                <span className="text-xs font-medium">Cart</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="lg:hidden">
        <div className="px-3 py-2 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="w-9 h-9" />
            <span className="text-lg font-bold text-[#3b82f6]">Kush deals</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/wishlist" className="relative text-gray-700 hover:text-[#ff4747]">
              <Heart className="w-5 h-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-2 bg-[#ff4747] text-white text-[10px] font-semibold rounded-full px-1.5 py-0.5">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <Link to="/cart" className="relative text-gray-700 hover:text-[#ff4747]">
              <ShoppingCart className="w-5 h-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-[#ff4747] text-white text-[10px] font-semibold rounded-full px-1.5 py-0.5">
                  {cartItemsCount}
                </span>
              )}
            </Link>
          </div>
        </div>
        <div className="px-3 pb-2">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for products"
              className="w-full bg-gray-100 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none"
            />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4.5 h-4.5" />
          </form>
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
              <li><a href="mailto:support@kushdeals.com" className="text-[7px] text-gray-400 hover:text-white transition-colors">support@kushdeals.com</a></li>
              <li><a href="tel:+1800KUSHDEALS" className="text-[7px] text-gray-400 hover:text-white transition-colors">1-800-KUSH-DEALS</a></li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-gray-800 pt-1">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-1.5">
            <p className="text-[8px] text-gray-400">© {new Date().getFullYear()} Kush deals. All rights reserved.</p>
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
  const isDashboardPage = location.pathname.startsWith('/seller-dashboard');

  return (
    <>
      <ScrollToTop />
      {/* Header - fixed to remain visible while scrolling */}
      {!isDashboardPage && (
        <header className="bg-white shadow-md fixed inset-x-0 top-0 z-50">
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
                    <Logo className="w-10 h-10" />
                    <span className="text-2xl font-bold text-[#3b82f6]">Kush deals</span>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </header>
      )}

      {/* Spacer below fixed header (reduced mobile height) - hidden on product detail pages and dashboard */}
      {!isProductDetailPage && !isDashboardPage && <div className="h-[56px] sm:h-[72px]" />}

      {/* Page Routes */}
      <main>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/store" element={<Navigate to="/shop" replace />} />
              <Route path="/store/:sellerId" element={<StoreProfile />} />
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
              <Route path="/settings" element={<Settings />} />
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
    <ErrorBoundary>
      <SupabaseAuthProvider>
        <CartProvider>
          <ToastProvider>
            <Router>
              <AppContent />
            </Router>
          </ToastProvider>
        </CartProvider>
      </SupabaseAuthProvider>
    </ErrorBoundary>
  );
}

export default App;
