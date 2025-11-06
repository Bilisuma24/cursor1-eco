import React from "react"
import DashboardLayout from "../components/DashboardLayout"
import { Routes, Route } from "react-router-dom"
import { SellerRoute } from "../components/ProtectedRoute"
import Overview from "./seller/Overview"
import Products from "./seller/Products"
import ProductForm from "./seller/ProductForm"
import Orders from "./seller/Orders"
import Settings from "./seller/Settings"

export default function SellerDashboard() {
  return (
    <SellerRoute>
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
    </SellerRoute>
  )
}