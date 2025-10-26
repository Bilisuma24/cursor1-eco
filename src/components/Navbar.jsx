import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { Menu, X, User, LogOut } from "lucide-react";
import { AuthContext } from "../contexts/AuthContext";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
  };

  const publicLinks = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  const authLinks = user ? [
    { name: "Profile", path: "/profile", icon: <User className="w-4 h-4" /> },
    { name: "Logout", action: handleLogout, icon: <LogOut className="w-4 h-4" /> },
  ] : [
    { name: "Sign Up", path: "/signup" },
    { name: "Login", path: "/login" },
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
        {/* Logo */}
        <Link
          to="/"
          className="text-2xl font-extrabold text-emerald-700 hover:text-emerald-600"
        >
          EcoStore
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center space-x-6">
          {publicLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className="text-gray-700 font-medium hover:text-emerald-600 hover:scale-105"
            >
              {link.name}
            </Link>
          ))}
          
          {/* User Menu */}
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user.name}</span>
              {authLinks.map((link) => (
                link.action ? (
                  <button
                    key={link.name}
                    onClick={link.action}
                    className="flex items-center space-x-1 text-gray-700 font-medium hover:text-emerald-600 hover:scale-105"
                  >
                    {link.icon}
                    <span>{link.name}</span>
                  </button>
                ) : (
                  <Link
                    key={link.name}
                    to={link.path}
                    className="flex items-center space-x-1 text-gray-700 font-medium hover:text-emerald-600 hover:scale-105"
                  >
                    {link.icon}
                    <span>{link.name}</span>
                  </Link>
                )
              ))}
            </div>
          ) : (
            authLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className="text-gray-700 font-medium hover:text-emerald-600 hover:scale-105"
              >
                {link.name}
              </Link>
            ))
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden p-2 rounded-lg hover:bg-emerald-100"
        >
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="md:hidden bg-white shadow-md border-t border-emerald-100">
          {publicLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setMenuOpen(false)}
              className="block px-6 py-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600"
            >
              {link.name}
            </Link>
          ))}
          
          {user && (
            <div className="border-t border-gray-200 px-6 py-3">
              <p className="text-sm text-gray-500 mb-2">Welcome, {user.name}</p>
            </div>
          )}
          
          {authLinks.map((link) => (
            link.action ? (
              <button
                key={link.name}
                onClick={() => {
                  link.action();
                  setMenuOpen(false);
                }}
                className="flex items-center space-x-2 w-full px-6 py-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600"
              >
                {link.icon}
                <span>{link.name}</span>
              </button>
            ) : (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMenuOpen(false)}
                className="flex items-center space-x-2 px-6 py-3 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600"
              >
                {link.icon}
                <span>{link.name}</span>
              </Link>
            )
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
