import React from "react"
import { NavLink, Link } from "react-router-dom"
import { 
  BarChart3, 
  Package, 
  ShoppingCart, 
  Settings, 
  Plus,
  Store
} from "lucide-react"

export default function DashboardLayout({ children }) {
  const linkClass = ({ isActive }) => 
    `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
      isActive 
        ? "bg-blue-600 text-white shadow-md" 
        : "text-gray-900 hover:bg-blue-50 hover:text-blue-600"
    }`

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 sticky top-8">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                    <Store className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Seller Dashboard</h2>
                    <p className="text-sm text-gray-500">Manage your store</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                <NavLink to="/seller-dashboard" end className={linkClass}>
                  <BarChart3 className="h-5 w-5" />
                  <span>Overview</span>
                </NavLink>
                <NavLink to="/seller-dashboard/products" className={linkClass}>
                  <Package className="h-5 w-5" />
                  <span>Products</span>
                </NavLink>
                <NavLink to="/seller-dashboard/orders" className={linkClass}>
                  <ShoppingCart className="h-5 w-5" />
                  <span>Orders</span>
                </NavLink>
                <NavLink to="/seller-dashboard/settings" className={linkClass}>
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </NavLink>
              </nav>

              {/* Quick Action */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <Link
                  to="/seller-dashboard/products/new"
                  className="flex items-center justify-center space-x-2 w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg text-sm font-semibold"
                >
                  <Plus className="h-5 w-5" />
                  <span>Add Product</span>
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 min-h-[600px]">
              <div className="p-6 sm:p-8">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}