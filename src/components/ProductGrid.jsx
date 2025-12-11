import React from "react";
import ProductCard from "./ProductCard";

export default function ProductGrid({ products = [], onAdd, onAddToCart }) {
  return (
    <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} onAdd={onAdd} onAddToCart={onAddToCart} />
      ))}
    </div>
  );
}
