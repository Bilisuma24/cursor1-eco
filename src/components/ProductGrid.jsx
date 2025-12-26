import React from "react";
import ProductCard from "./ProductCard";

export default function ProductGrid({ products = [], onAdd, onAddToCart }) {
  return (
    <div className="grid gap-2 grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} onAdd={onAdd} onAddToCart={onAddToCart} />
      ))}
    </div>
  );
}
