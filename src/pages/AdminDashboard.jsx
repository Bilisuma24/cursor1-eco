import { useState } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AdminRoute } from '../components/ProtectedRoute';
import AdminOverview from './admin/Overview';
import AdminUsers from './admin/Users';
import AdminSellers from './admin/Sellers';
import AdminProducts from './admin/Products';
import AdminCategoriesTags from './admin/CategoriesTags';
import AdminAnalytics from './admin/Analytics';
import AdminModeration from './admin/Moderation';
import AdminBanners from './admin/Banners';
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  Package, 
  Tags, 
  BarChart3, 
  Shield, 
  Image as ImageIcon,
  Menu,
  X
} from 'lucide-react';

export default function AdminDashboard() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const linkBase = 'flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-all duration-200';
  const linkActive = 'flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 rounded-lg border-l-4 border-purple-700 dark:border-purple-400';

  const navItems = [
    { path: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/sellers', label: 'Sellers', icon: Store },
    { path: '/admin/products', label: 'Products', icon: Package },
    { path: '/admin/categories-tags', label: 'Categories & Tags', icon: Tags },
    { path: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/admin/moderation', label: 'Moderation', icon: Shield },
    { path: '/admin/banners', label: 'Banners & Promotions', icon: ImageIcon },
  ];

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Header */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Manage your e-commerce platform</p>
              </div>
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Navigation - Desktop */}
            <div className="hidden lg:block bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-3 lg:py-4">
              <nav className="flex flex-wrap gap-2">
                {navItems.map(({ path, label, icon: Icon, end }) => (
                  <NavLink 
                    key={path}
                    to={path} 
                    end={end}
                    className={({ isActive }) => isActive ? linkActive : linkBase}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="whitespace-nowrap">{label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Mobile Navigation - Dropdown */}
            {mobileMenuOpen && (
              <div className="lg:hidden bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 px-3 py-3">
                <nav className="flex flex-col gap-1">
                  {navItems.map(({ path, label, icon: Icon, end }) => (
                    <NavLink 
                      key={path}
                      to={path} 
                      end={end}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) => isActive ? linkActive : linkBase}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span>{label}</span>
                    </NavLink>
                  ))}
                </nav>
              </div>
            )}

            {/* Content */}
            <div className="p-3 sm:p-4 lg:p-6 xl:p-8">
              <Routes>
                <Route path="/" element={<AdminOverview />} />
                <Route path="/users" element={<AdminUsers />} />
                <Route path="/sellers" element={<AdminSellers />} />
                <Route path="/products" element={<AdminProducts />} />
                <Route path="/categories-tags" element={<AdminCategoriesTags />} />
                <Route path="/analytics" element={<AdminAnalytics />} />
                <Route path="/moderation" element={<AdminModeration />} />
                <Route path="/banners" element={<AdminBanners />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Routes>
            </div>
          </div>
        </div>
      </div>
    </AdminRoute>
  );
}






