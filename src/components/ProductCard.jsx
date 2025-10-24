import React from "react";

export default function ProductCard({ product, onAdd }) {
  return (
    <div className="card flex flex-col">
      <img
        src={product.image}
        alt={product.name}
        className="rounded-lg mb-4 w-full h-64 object-cover"
      />
      <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
      <p className="text-sm text-gray-500 mb-4">{product.description}</p>
      <div className="mt-auto flex justify-between items-center">
        <span className="font-bold text-indigo-600 text-lg">${product.price}</span>
        <button
          onClick={() => onAdd(product)}
          className="btn btn-primary text-sm"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
}
