import React from "react"
import { useParams } from "react-router-dom"

export default function ProductDetail() {
  const { id } = useParams()
  const product = { id, name: "Eco Bottle", price: 1999, description: "Detailed description", image_url: "" }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm">
        <div className="w-full h-72 bg-gray-100 rounded-lg overflow-hidden">
          <img src={product.image_url || `https://via.placeholder.com/1200x800?text=${encodeURIComponent(product.name)}`} alt={product.name} className="w-full h-full object-cover" />
        </div>
        <h1 className="text-2xl font-semibold mt-4">{product.name}</h1>
        <p className="text-gray-600 mt-3">{product.description}</p>
      </div>

      <aside className="bg-white rounded-xl p-6 shadow-sm">
        <div className="text-sm text-gray-600">Price</div>
        <div className="text-2xl font-bold text-primary mt-1">${(product.price / 100).toFixed(2)}</div>
        <div className="mt-4">
          <button className="w-full rounded-lg py-2 bg-accent text-primary font-semibold hover:scale-105 transition">Add to cart</button>
        </div>
      </aside>
    </div>
  )
}