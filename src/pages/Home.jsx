import React from "react";
import ProductGrid from "../components/ProductGrid";

export default function Home({ products, onAdd }) {
  return (
    <div>
      {/* Hero section */}
      <section className="text-center py-20 bg-gradient-to-b from-indigo-50 to-white">
        <h1 className="text-5xl font-extrabold text-indigo-700 mb-4">
          Premium Clothing for Everyday Comfort
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto text-lg">
          Discover styles that blend quality, comfort, and design.
        </p>
        <button className="mt-8 bg-indigo-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-indigo-700">
          Shop Now
        </button>
      </section>

      {/* Products */}
      <section className="py-16 container mx-auto px-4">
        <h2 className="text-3xl font-semibold mb-8 text-center text-gray-800">
          Featured Products
        </h2>
        <ProductGrid products={products} onAdd={onAdd} />
      </section>
    </div>
  );
}
