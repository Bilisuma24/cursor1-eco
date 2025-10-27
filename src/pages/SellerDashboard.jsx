import React from "react"
import DashboardLayout from "../components/DashboardLayout"
import { Routes, Route, Navigate, Link } from "react-router-dom"
import { useSupabaseAuth } from "../hooks/useSupabaseAuth"
import { useUserRole } from "../hooks/useUserRole"
import Overview from "./seller/Overview"
import Products from "./seller/Products"
import ProductForm from "./seller/ProductForm"
import Orders from "./seller/Orders"

// Settings placeholder component
function Settings() {
  return (
    <div className="text-center py-12">
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Settings</h2>
      <p className="text-gray-600">Settings page coming soon...</p>
    </div>
  )
}

// Protected route component
function ProtectedSellerRoute({ children }) {
  const { user, loading: authLoading } = useSupabaseAuth()
  const { userRole, isSeller, loading: roleLoading } = useUserRole()
  
  if (authLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  if (!user) {
    return <Navigate to="/login" replace />
  }
  
  if (!isSeller) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You need to be a seller to access this dashboard. 
            {userRole === 'buyer' ? ' You are currently registered as a buyer.' : ' Please complete your profile setup.'}
          </p>
          <div className="space-x-4">
            <Link 
              to="/profile" 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Profile
            </Link>
            <Link 
              to="/" 
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    )
  }
  
  return children
}

export default function SellerDashboard() {
  return (
    <ProtectedSellerRoute>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="products" element={<Products />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id/edit" element={<ProductForm />} />
          <Route path="orders" element={<Orders />} />
          <Route path="settings" element={<Settings />} />
        </Routes>
      </DashboardLayout>
    </ProtectedSellerRoute>
  )
}