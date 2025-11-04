import React from "react"
import Navbar from "./Navbar"
import Footer from "./Footer"

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-bg text-site-text overflow-x-hidden">
      <Navbar />
      {/* RESPONSIVE FIX: Improved padding for mobile */}
      <main className="flex-1 container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">{children}</main>
      <Footer />
    </div>
  )
}