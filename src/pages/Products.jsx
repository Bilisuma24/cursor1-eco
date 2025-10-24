import React from "react"
import ProductGrid from "../components/ProductGrid"

export default function Products() {
  const products = React.useMemo(() => Array.from({ length: 9 }).map((_, i) => ({
    id: String(i + 1),
    name: `Product ${i + 1}`,
    price: 1299 + i * 100,
    description: "Sustainable example product",
    image_url: ""
  })), [])

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-site-text">All products</h1>
        <p className="text-sm text-gray-600">Showing {products.length} items</p>
      </div>

      <section className="bg-bg -mx-4 px-4 py-6">
        <div className="container mx-auto">
          <ProductGrid products={products} onAdd={() => alert("Add to cart")} />
        </div>
      </section>
    </div>
  )
}