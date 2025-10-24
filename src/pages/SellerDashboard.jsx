import React from "react"
import DashboardLayout from "../components/DashboardLayout"
import { Routes, Route, Link } from "react-router-dom"

function Overview() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Overview</h2>
        <Link className="text-sm bg-accent text-primary px-3 py-1 rounded-md">Add product</Link>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">Sales: <div className="text-2xl font-bold text-primary">—</div></div>
        <div className="bg-white rounded-xl p-4 shadow-sm">Products: <div className="text-2xl font-bold text-primary">—</div></div>
      </div>
    </div>
  )
}
function Products() { return <div><h2 className="text-xl font-semibold">Products</h2></div> }
function Orders() { return <div><h2 className="text-xl font-semibold">Orders</h2></div> }

export default function SellerDashboard() {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="products" element={<Products />} />
        <Route path="orders" element={<Orders />} />
      </Routes>
    </DashboardLayout>
  )
}