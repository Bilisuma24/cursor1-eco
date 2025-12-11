import React, { useState } from "react"
import { NavLink, Link, useNavigate } from "react-router-dom"
import { 
  BarChart3, 
  Package, 
  ShoppingCart, 
  Settings, 
  Home,
  Search,
  Bell,
  MoreVertical,
  LogOut,
  User,
  Calendar,
  Contact,
  Menu,
  X
} from "lucide-react"
import { useAuth } from "../contexts/SupabaseAuthContext"
import Logo from "./Logo"

export default function DashboardLayout({ children }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const linkClass = ({ isActive }) => 
    `flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive 
        ? "bg-white/10 text-white" 
        : "text-white/80 hover:bg-white/5 hover:text-white"
    }`

  const getUserInitials = () => {
    if (user?.user_metadata?.name) {
      return user.user_metadata.name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getUserDisplayName = () => {
    return user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-blue-600 lg:bg-gray-50 flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <header className="lg:hidden bg-blue-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 -ml-2"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-white" />
            ) : (
              <Menu className="h-6 w-6 text-white" />
            )}
          </button>
          <Logo className="w-8 h-8" />
          <h1 className="text-lg font-bold text-white">kushdeals</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2">
            <Search className="h-5 w-5 text-white" />
          </button>
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            {getUserInitials()}
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-blue-600">
          <div className="p-6 flex flex-col h-full">
            {/* Logo */}
            <div className="mb-8 flex items-center gap-3">
              <Logo className="w-10 h-10" />
              <h1 className="text-2xl font-bold text-white">kushdeals</h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1">
              <NavLink 
                to="/" 
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => 
                  `flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? "bg-white/10 text-white" 
                      : "text-white/80 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                <Home className="h-5 w-5" />
                <span>Home</span>
              </NavLink>
              <NavLink 
                to="/seller-dashboard" 
                end 
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => 
                  `flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? "bg-gray-200 text-gray-900" 
                      : "text-white/80 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                <BarChart3 className="h-5 w-5" />
                <span>Dashboard</span>
              </NavLink>
              <NavLink 
                to="/seller-dashboard/products" 
                onClick={() => setMobileMenuOpen(false)}
                className={linkClass}
              >
                <Package className="h-5 w-5" />
                <span>Products</span>
              </NavLink>
              <NavLink 
                to="/seller-dashboard/orders" 
                onClick={() => setMobileMenuOpen(false)}
                className={linkClass}
              >
                <ShoppingCart className="h-5 w-5" />
                <span>Orders</span>
              </NavLink>
              <NavLink 
                to="/profile" 
                onClick={() => setMobileMenuOpen(false)}
                className={linkClass}
              >
                <Contact className="h-5 w-5" />
                <span>Contact</span>
              </NavLink>
              <NavLink 
                to="/seller-dashboard/settings" 
                onClick={() => setMobileMenuOpen(false)}
                className={linkClass}
              >
                <Calendar className="h-5 w-5" />
                <span>Calendar</span>
              </NavLink>
              <NavLink 
                to="/seller-dashboard/settings" 
                onClick={() => setMobileMenuOpen(false)}
                className={linkClass}
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </NavLink>
            </nav>

            {/* Sign Out */}
            <div className="mt-auto pt-6 border-t border-white/20">
              <button
                onClick={() => {
                  handleSignOut();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white transition-colors w-full"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blue Sidebar - Hidden on mobile */}
      <aside className="hidden lg:flex w-52 bg-blue-600 min-h-screen sticky top-0 flex-col rounded-r-3xl">
        <div className="p-6 flex flex-col h-full">
          {/* Logo */}
          <div className="mb-10 flex items-center gap-3">
            <Logo className="w-10 h-10" />
            <h1 className="text-2xl font-bold text-white">kushdeals</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1">
            <NavLink to="/" className={({ isActive }) => 
              `flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? "bg-white/10 text-white" 
                  : "text-white/80 hover:bg-white/5 hover:text-white"
              }`
            }>
              <Home className="h-5 w-5" />
              <span>Home</span>
            </NavLink>
            <NavLink to="/seller-dashboard" end className={({ isActive }) => 
              `flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? "bg-gray-200 text-gray-900" 
                  : "text-white/80 hover:bg-white/5 hover:text-white"
              }`
            }>
              <BarChart3 className="h-5 w-5" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/seller-dashboard/products" className={linkClass}>
              <Package className="h-5 w-5" />
              <span>Products</span>
            </NavLink>
            <NavLink to="/seller-dashboard/orders" className={linkClass}>
              <ShoppingCart className="h-5 w-5" />
              <span>Orders</span>
            </NavLink>
            <NavLink to="/profile" className={linkClass}>
              <Contact className="h-5 w-5" />
              <span>Contact</span>
            </NavLink>
            <NavLink to="/seller-dashboard/settings" className={linkClass}>
              <Calendar className="h-5 w-5" />
              <span>Calendar</span>
            </NavLink>
            <NavLink to="/seller-dashboard/settings" className={linkClass}>
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </NavLink>
          </nav>

          {/* Sign Out */}
          <div className="mt-auto pt-6 border-t border-white/20">
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white transition-colors w-full"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-blue-600 lg:bg-gray-50">
        {/* Desktop Top Header */}
        <header className="hidden lg:flex bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between w-full">
            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search Here"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Right Icons */}
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="h-5 w-5 text-gray-600" />
              </button>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {getUserInitials()}
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreVertical className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 lg:p-8 pb-6 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  )
}