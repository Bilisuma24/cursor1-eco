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
  Image as ImageIcon 
} from 'lucide-react';

export default function AdminDashboard() {
  const linkBase = 'flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-all duration-200';
  const linkActive = 'flex items-center gap-2 px-4 py-3 text-sm font-medium text-purple-700 bg-purple-50 rounded-lg border-l-4 border-purple-700';

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage your e-commerce platform</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Navigation */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
              <nav className="flex flex-wrap gap-2">
                {navItems.map(({ path, label, icon: Icon, end }) => (
                  <NavLink 
                    key={path}
                    to={path} 
                    end={end}
                    className={({ isActive }) => isActive ? linkActive : linkBase}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="p-6 sm:p-8">
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






