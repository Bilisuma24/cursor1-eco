import React from "react"
import { NavLink } from "react-router-dom"

export default function DashboardLayout({ children }) {
  const linkClass = ({ isActive }) => `block px-3 py-2 rounded-md text-sm font-medium transition ${isActive ? "bg-white/10 text-white" : "text-white/90 hover:bg-white/6"}`
  return (
    <div className="min-h-[70vh] grid grid-cols-1 md:grid-cols-6 gap-6">
      <aside className="md:col-span-1 bg-primary text-white rounded-xl p-4 shadow">
        <div className="mb-6">
          <div className="text-lg font-semibold">Seller</div>
          <div className="text-xs text-white/80">Manage your store</div>
        </div>
        <nav className="flex flex-col gap-2">
          <NavLink to="/seller" end className={linkClass}>Overview</NavLink>
          <NavLink to="/seller/products" className={linkClass}>Products</NavLink>
          <NavLink to="/seller/orders" className={linkClass}>Orders</NavLink>
          <NavLink to="/seller/settings" className={linkClass}>Settings</NavLink>
        </nav>
        <div className="mt-6">
          <button className="w-full rounded-lg py-2 bg-accent text-primary font-semibold hover:scale-105 transition">Add Product</button>
        </div>
      </aside>

      <div className="md:col-span-5 space-y-4">
        {children}
      </div>
    </div>
  )
}