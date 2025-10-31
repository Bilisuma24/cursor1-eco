import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut, ChevronDown, Settings } from "lucide-react";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
import DarkModeToggle from "./DarkModeToggle";
import SearchSuggestions from "./SearchSuggestions";
import LevelBadge from "./achievements/LevelBadge";
import { getUserLevel } from "../services/achievementService";
import { useUserRole } from "../hooks/useUserRole";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { user, signOut, loading: authLoading } = useSupabaseAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [level, setLevel] = useState(null);
  const { userRole, isSeller, isAdmin } = useUserRole();

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const toggleUserDropdown = () => setUserDropdownOpen(!userDropdownOpen);

  const handleLogout = async () => {
    await signOut();
    setMenuOpen(false);
    setUserDropdownOpen(false);
    navigate("/");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch compact level badge (buyer)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!user) return;
        const lvl = await getUserLevel(user.id, 'buyer');
        if (mounted) setLevel(lvl);
      } catch {}
    })();
    return () => { mounted = false; };
  }, [user]);

  const publicLinks = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.user_metadata?.name) {
      return user.user_metadata.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return 'U';
  };

  const getUserDisplayName = () => {
    return user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  };

  const getAvatarUrl = () => user?.user_metadata?.avatar_url || "";

  return (
    <nav className="glass shadow-lg sticky top-0 z-50 backdrop-blur">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
        {/* Logo */}
        <Link
          to="/"
          className="text-2xl font-extrabold text-gradient-animated hover-scale transition-all duration-300"
        >
          EcoStore
        </Link>

        {/* Desktop Search */}
        <div className="hidden md:block flex-1 px-6">
          <SearchSuggestions onSearch={(q) => navigate(`/shop?search=${encodeURIComponent(q)}`)} />
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center space-x-6">
          {publicLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className="text-gray-700 font-medium hover:text-gradient transition-all duration-300 hover-scale-sm relative group"
            >
              {link.name}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 group-hover:w-full"></span>
            </Link>
          ))}
          
          {/* Achievements badge */}
          {level && (
            <LevelBadge levelName={level?.badge?.split('/').pop()?.replace('.svg','')} badge={level?.badge} />
          )}

          {/* Dark Mode Toggle */}
          <DarkModeToggle />
          
          {/* User Menu */}
          {user ? (
            <div className="relative flex items-center gap-2" ref={dropdownRef}>
              <Link
                to="/profile"
                className="flex items-center space-x-2 text-gray-700 hover:text-gradient transition-all duration-300 hover-scale ripple"
                title="Profile"
              >
                {getAvatarUrl() ? (
                  <img src={getAvatarUrl()} alt="Avatar" className="w-8 h-8 rounded-full object-cover border shadow-lg hover-scale" />
                ) : (
                  <div className="w-8 h-8 gradient-bg-1 text-white rounded-full flex items-center justify-center text-sm font-semibold shadow-lg hover-scale pulse-ring">
                    {getUserInitials()}
                  </div>
                )}
                <span className="hidden sm:block font-medium">{getUserDisplayName()}</span>
              </Link>
              <button
                onClick={toggleUserDropdown}
                aria-label="Open menu"
                className="p-1 rounded hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 transition-all duration-300"
              >
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${userDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* User Dropdown */}
              {userDropdownOpen && (
                <div className="absolute right-0 top-full translate-y-2 w-80 glass rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-slide-up">
                  {/* User Card */}
                  <div className="px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      {getAvatarUrl() ? (
                        <img src={getAvatarUrl()} alt="Avatar" className="w-10 h-10 rounded-full object-cover border shadow-lg" />
                      ) : (
                        <div className="w-10 h-10 gradient-bg-1 text-white rounded-full flex items-center justify-center text-sm font-semibold shadow-lg">
                          {getUserInitials()}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{getUserDisplayName()}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </div>
                  {/* Actions */}
                  <Link
                    to="/profile"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300 hover-scale-sm rounded-lg mx-2"
                  >
                    <User className="w-4 h-4" />
                    <span>Profile</span>
                  </Link>
                  {isSeller && (
                    <Link
                      to="/seller-dashboard"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300 hover-scale-sm rounded-lg mx-2"
                    >
                      <span>Seller Dashboard</span>
                    </Link>
                  )}
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300 hover-scale-sm rounded-lg mx-2"
                    >
                      <span>Admin Dashboard</span>
                    </Link>
                  )}
                  <Link
                    to="/orders"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300 hover-scale-sm rounded-lg mx-2"
                  >
                    <span>Orders</span>
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 hover-scale-sm rounded-lg mx-2"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                  <div className="border-t border-gray-200 my-1" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 w-full px-4 py-2 text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 transition-all duration-300 hover-scale-sm rounded-lg mx-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Link
                to="/signup"
                className="text-gray-700 font-medium hover:text-gradient transition-all duration-300 hover-scale-sm"
              >
                Sign Up
              </Link>
              <Link
                to="/login"
                className="btn-modern ripple"
              >
                Login
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden p-2 rounded-lg hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 transition-all duration-300 hover-scale ripple"
        >
          {menuOpen ? <X size={28} className="text-gradient" /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="md:hidden glass shadow-lg border-t border-gray-200 animate-slide-up">
          <div className="px-4 py-3">
            <SearchSuggestions onSearch={(q) => { navigate(`/shop?search=${encodeURIComponent(q)}`); setMenuOpen(false); }} />
          </div>
          {publicLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setMenuOpen(false)}
              className="block px-6 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300 hover-scale-sm"
            >
              {link.name}
            </Link>
          ))}
          
          {user ? (
            <>
            <div className="border-t border-gray-200 px-6 py-3 bg-gradient-to-r from-purple-50 to-pink-50">
                <div className="flex items-center space-x-3">
                  {getAvatarUrl() ? (
                    <img src={getAvatarUrl()} alt="Avatar" className="w-10 h-10 rounded-full object-cover border shadow-lg" />
                  ) : (
                    <div className="w-10 h-10 gradient-bg-1 text-white rounded-full flex items-center justify-center text-sm font-semibold shadow-lg">
                      {getUserInitials()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900">{getUserDisplayName()}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
              </div>
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center space-x-2 px-6 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300 hover-scale-sm"
              >
                <User className="w-4 h-4" />
                <span>Profile</span>
              </Link>
              {isSeller && (
                <Link
                  to="/seller-dashboard"
                  onClick={() => setMenuOpen(false)}
                  className="block px-6 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300 hover-scale-sm"
                >
                  Seller Dashboard
                </Link>
              )}
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="block px-6 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300 hover-scale-sm"
                >
                  Admin Dashboard
                </Link>
              )}
              <Link
                to="/settings"
                onClick={() => setMenuOpen(false)}
                className="flex items-center space-x-2 px-6 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 hover-scale-sm"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
                className="flex items-center space-x-2 w-full px-6 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 transition-all duration-300 hover-scale-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/signup"
                onClick={() => setMenuOpen(false)}
                className="block px-6 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300 hover-scale-sm"
              >
                Sign Up
              </Link>
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="block px-6 py-3 btn-modern text-center mx-4 my-2 ripple"
              >
                Login
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
