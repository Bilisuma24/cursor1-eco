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

export default function AdminDashboard() {
  const linkBase = 'text-gray-600 hover:text-purple-700';
  const linkActive = 'text-purple-700 font-semibold border-b-2 border-purple-700';

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

          <div className="bg-white rounded-lg shadow border border-gray-200">
            <div className="px-4 pt-4">
              <nav className="flex flex-wrap gap-4 border-b border-gray-200 pb-4">
                <NavLink to="/admin" end className={({ isActive }) => `${isActive ? linkActive : linkBase}`}>Overview</NavLink>
                <NavLink to="/admin/users" className={({ isActive }) => `${isActive ? linkActive : linkBase}`}>Users</NavLink>
                <NavLink to="/admin/sellers" className={({ isActive }) => `${isActive ? linkActive : linkBase}`}>Sellers</NavLink>
                <NavLink to="/admin/products" className={({ isActive }) => `${isActive ? linkActive : linkBase}`}>Products</NavLink>
                <NavLink to="/admin/categories-tags" className={({ isActive }) => `${isActive ? linkActive : linkBase}`}>Categories & Tags</NavLink>
                <NavLink to="/admin/analytics" className={({ isActive }) => `${isActive ? linkActive : linkBase}`}>Analytics</NavLink>
                <NavLink to="/admin/moderation" className={({ isActive }) => `${isActive ? linkActive : linkBase}`}>Moderation</NavLink>
                <NavLink to="/admin/banners" className={({ isActive }) => `${isActive ? linkActive : linkBase}`}>Banners & Promotions</NavLink>
              </nav>
            </div>

            <div className="p-4">
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



