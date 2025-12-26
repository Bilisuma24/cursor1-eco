import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { Search, Heart, User, ChevronDown, Globe, MapPin, LogOut, ChevronUp, ShoppingCart, Menu, Camera, Mic, QrCode, ChevronRight, Bell } from "lucide-react";
import { useState, useContext, useEffect, useRef } from "react";
import productsData from "./data/products.js";
import Logo from "./components/Logo";
import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Category from "./pages/Category";
import SearchResults from "./pages/SearchResults";
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
      {!isDashboardPage && !isProductDetailPage && (
        <header className="fixed inset-x-0 top-0 z-[9999] overflow-visible">
          <Navbar />
        </header>
      )}

      {/* Spacer below fixed header */}
      {!isProductDetailPage && !isDashboardPage && <div className="h-[82px] md:h-[100px]" />}

      {/* Page Routes */}
      <main>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/category/:categoryName" element={<Category />} />
          <Route path="/search" element={<SearchResults />} />
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
