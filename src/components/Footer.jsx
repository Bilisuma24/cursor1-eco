import React from "react";

export default function Footer() {
  return (
    <footer className="bg-white shadow-inner py-6 text-center text-gray-500 text-sm mt-10">
      © {new Date().getFullYear()} QuantumKit. All rights reserved.
    </footer>
  );
}
