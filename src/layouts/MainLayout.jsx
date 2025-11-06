import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 overflow-x-hidden">
      <Navbar />
      {/* RESPONSIVE FIX: Improved padding for mobile */}
      <main className="flex-grow container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-10">
        <Outlet /> {/* ✅ This renders your pages here */}
      </main>
      <Footer />
    </div>
  );
}
