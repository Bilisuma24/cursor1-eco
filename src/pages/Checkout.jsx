import React from "react"
import { useCart } from "../contexts/CartContext"
import { Link } from "react-router-dom"

export default function Checkout() {
  const { items, clear } = useCart()
  const total = items.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-xl font-semibold">Checkout</h1>
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="text-sm text-gray-600">Review your order</div>
        <div className="mt-4 space-y-3">
          {items.length === 0 && <div className="text-gray-600">No items in cart. <Link to="/products" className="text-primary ml-1">Browse products</Link></div>}
          {items.map((it) => (
            <div key={it.id} className="flex items-center justify-between">
              <div className="text-sm">{it.name} x {it.qty}</div>
              <div className="font-semibold">${(((it.price || 0) * (it.qty || 1)) / 100).toFixed(2)}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-center justify-between">
          <div className="text-lg font-semibold">Total</div>
          <div className="text-2xl font-bold text-primary">${(total/100).toFixed(2)}</div>
        </div>
        <div className="mt-6 flex gap-3">
          <button className="flex-1 rounded-lg py-2 bg-primary text-white font-semibold hover:brightness-110 transition">Place Order</button>
          <button onClick={clear} className="rounded-lg py-2 px-4 border border-gray-200">Clear</button>
        </div>
      </div>
    </div>
  )
}