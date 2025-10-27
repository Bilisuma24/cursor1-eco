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
    `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
      isActive 
        ? "bg-white text-blue-600 shadow-sm" 
        : "text-gray-700 hover:bg-white hover:text-blue-600"
    }`

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Store className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Seller Dashboard</h2>
                    <p className="text-sm text-gray-500">Manage your store</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-2">
                <NavLink to="/seller-dashboard" end className={linkClass}>
                  <BarChart3 className="h-4 w-4" />
                  <span>Overview</span>
                </NavLink>
                <NavLink to="/seller-dashboard/products" className={linkClass}>
                  <Package className="h-4 w-4" />
                  <span>Products</span>
                </NavLink>
                <NavLink to="/seller-dashboard/orders" className={linkClass}>
                  <ShoppingCart className="h-4 w-4" />
                  <span>Orders</span>
                </NavLink>
                <NavLink to="/seller-dashboard/settings" className={linkClass}>
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </NavLink>
              </nav>

              {/* Quick Action */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <Link
                  to="/seller-dashboard/products/new"
                  className="flex items-center space-x-2 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Product</span>
                </Link>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 min-h-[600px]">
              <div className="p-6">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}