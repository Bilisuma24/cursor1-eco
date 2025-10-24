import React from "react";
import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <Link
          to="/"
          className="text-2xl font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          QuantumKit
        </Link>

        <ul className="hidden md:flex space-x-8 text-gray-700 font-medium">
          <li><Link to="/" className="hover:text-indigo-600">Home</Link></li>
          <li><Link to="/products" className="hover:text-indigo-600">Shop</Link></li>
          <li><Link to="/contact" className="hover:text-indigo-600">Contact</Link></li>
        </ul>

        <Link
          to="/cart"
          className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-indigo-700"
        >
          Cart
        </Link>
      </nav>
    </header>
  );
}
