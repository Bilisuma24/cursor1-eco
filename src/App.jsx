import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Search, ShoppingCart, Heart, User, Menu, X } from "lucide-react";
import { useState, useContext } from "react";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import About from "./pages/About";
import Contact from "./pages/Contact";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import ProductDetail from "./pages/ProductDetail";
import Wishlist from "./pages/Wishlist";
import ScrollToTop from "./components/ScrollToTop";

import { CartProvider, useCart } from "./contexts/CartContext";
import { AuthProvider, AuthContext } from "./contexts/AuthContext";

function NavbarContent() {
  const { user, logout } = useContext(AuthContext);
  const { getCartItemsCount, wishlist } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchTerm)}`;
    }
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4">
        {/* Top Bar */}
        <div className="flex items-center justify-between py-3 text-sm text-gray-600">
          <div className="flex items-center space-x-6">
            <span>Free shipping on orders over $50</span>
            <span>•</span>
            <span>30-day return policy</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Customer Service: 1-800-ECO-SHOP</span>
            <span>•</span>
            <span>Help Center</span>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">E</span>
            </div>
            <span className="text-2xl font-bold text-gray-900">EcoShop</span>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search for products, brands, and more..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </form>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">
              Home
            </Link>
            <Link to="/shop" className="text-gray-700 hover:text-blue-600 font-medium">
              Shop
            </Link>
            <Link to="/about" className="text-gray-700 hover:text-blue-600 font-medium">
              About
            </Link>
            <Link to="/contact" className="text-gray-700 hover:text-blue-600 font-medium">
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

            {/* Cart */}
            <Link to="/cart" className="relative p-2 text-gray-700 hover:text-blue-600 transition-colors duration-200">
              <ShoppingCart className="w-6 h-6" />
              {getCartItemsCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getCartItemsCount()}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {!user ? (
              <div className="flex items-center space-x-2">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                >
                  Sign Up
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>
                <Link
                  to="/orders"
                  className="text-gray-700 hover:text-blue-600 font-medium"
                >
                  Orders
                </Link>
                <button
                  onClick={() => {
                    logout();
                    window.location.href = "/login";
                  }}
                  className="text-gray-700 hover:text-red-600 font-medium"
                >
                  Logout
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-blue-600"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-4">
              <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">
                Home
              </Link>
              <Link to="/shop" className="text-gray-700 hover:text-blue-600 font-medium">
                Shop
              </Link>
              <Link to="/about" className="text-gray-700 hover:text-blue-600 font-medium">
                About
              </Link>
              <Link to="/contact" className="text-gray-700 hover:text-blue-600 font-medium">
                Contact
              </Link>
              {user && (
                <>
                  <Link to="/profile" className="text-gray-700 hover:text-blue-600 font-medium">
                    Profile
                  </Link>
                  <Link to="/orders" className="text-gray-700 hover:text-blue-600 font-medium">
                    Orders
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  // Wrap Router with providers here so NavbarContent can access AuthContext
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <ScrollToTop />
          {/* Header (simple horizontal navbar) */}
          <header className="bg-white shadow-md sticky top-0 z-50">
            <NavbarContent />
          </header>

          {/* Page Routes */}
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/login" element={<Login />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </main>

          {/* Footer */}
          <footer className="bg-gray-900 text-white mt-auto">
            <div className="max-w-7xl mx-auto px-4 py-16">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Company Info */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-xl">E</span>
                    </div>
                    <span className="text-2xl font-bold">EcoShop</span>
                  </div>
                  <p className="text-gray-400 leading-relaxed">
                    Your trusted partner for quality products at unbeatable prices. Join millions of satisfied customers worldwide.
                  </p>
                  <div className="flex space-x-4">
                    <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors duration-200 cursor-pointer">
                      <span className="text-sm">f</span>
                    </div>
                    <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors duration-200 cursor-pointer">
                      <span className="text-sm">t</span>
                    </div>
                    <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors duration-200 cursor-pointer">
                      <span className="text-sm">i</span>
                    </div>
                  </div>
                </div>

                {/* Quick Links */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Quick Links</h3>
                  <ul className="space-y-2">
                    <li><Link to="/" className="text-gray-400 hover:text-white transition-colors duration-200">Home</Link></li>
                    <li><Link to="/shop" className="text-gray-400 hover:text-white transition-colors duration-200">Shop</Link></li>
                    <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors duration-200">About Us</Link></li>
                    <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors duration-200">Contact</Link></li>
                  </ul>
                </div>

                {/* Customer Service */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Customer Service</h3>
                  <ul className="space-y-2">
                    <li><Link to="/orders" className="text-gray-400 hover:text-white transition-colors duration-200">My Orders</Link></li>
                    <li><Link to="/wishlist" className="text-gray-400 hover:text-white transition-colors duration-200">Wishlist</Link></li>
                    <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Help Center</a></li>
                    <li><a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Returns</a></li>
                  </ul>
                </div>

                {/* Contact Info */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Contact Info</h3>
                  <div className="space-y-2 text-gray-400">
                    <p>📧 support@ecoshop.com</p>
                    <p>📞 1-800-ECO-SHOP</p>
                    <p>📍 123 Commerce St, Business City, BC 12345</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-800 mt-12 pt-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <p className="text-gray-400">© {new Date().getFullYear()} EcoShop. All rights reserved.</p>
                  <div className="flex space-x-6 mt-4 md:mt-0">
                    <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Privacy Policy</a>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Terms of Service</a>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">Cookie Policy</a>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
