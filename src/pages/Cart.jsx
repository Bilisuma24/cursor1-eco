import React from "react"
import { useCart } from "../contexts/CartContext"
import { Link } from "react-router-dom"

export default function Cart() {
  const { items, remove } = useCart()
  const total = items.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <h1 className="text-xl font-semibold">Your cart</h1>
        {items.length === 0 && <div className="bg-white rounded-xl p-6 shadow-sm text-gray-600">Your cart is empty. <Link to="/products" className="text-primary ml-1">Browse products</Link></div>}
        {items.map((it) => (
          <div key={it.id} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
            <div className="w-28 h-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
              <img src={it.image_url || `https://via.placeholder.com/320x240?text=${encodeURIComponent(it.name)}`} alt={it.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-site-text">{it.name}</div>
              <div className="text-sm text-gray-600">${(it.price/100).toFixed(2)} x {it.qty}</div>
            </div>
            <div className="font-semibold text-site-text">${((it.price * it.qty)/100).toFixed(2)}</div>
            <button onClick={() => remove(it.id)} className="ml-2 text-sm text-red-600">Remove</button>
          </div>
        ))}
      </div>

      <aside className="bg-white rounded-xl p-6 shadow-sm">
        <div className="text-sm text-gray-600">Order summary</div>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-lg font-semibold">Total</div>
          <div className="text-2xl font-bold text-primary">${(total/100).toFixed(2)}</div>
        </div>
        <div className="mt-4">
          <Link to="/checkout" className="block w-full text-center rounded-lg py-2 bg-accent text-primary font-semibold hover:scale-105 transition">Checkout</Link>
        </div>
      </aside>
    </div>
  )
}