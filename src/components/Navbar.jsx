import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut, ChevronDown, Settings } from "lucide-react";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
import DarkModeToggle from "./DarkModeToggle";
import SearchSuggestions from "./SearchSuggestions";
import LevelBadge from "./achievements/LevelBadge";
import { getUserLevel } from "../services/achievementService";
import { useUserRole } from "../hooks/useUserRole";
import Logo from "./Logo";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { user, signOut, loading: authLoading } = useSupabaseAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const [level, setLevel] = useState(null);
  const { userRole, isSeller, isAdmin } = useUserRole();
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const toggleUserDropdown = () => setUserDropdownOpen(!userDropdownOpen);
  
  // Swipe gesture handlers for mobile menu
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchEnd - touchStart; // Positive = downward swipe
    const isDownSwipe = distance > minSwipeDistance;
    
    // Close menu on downward swipe
    if (isDownSwipe && menuOpen) {
      setMenuOpen(false);
    }
  };

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

  // Close mobile menu when clicking backdrop or pressing Escape
  useEffect(() => {
    if (!menuOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    const handleBackdropClick = (e) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleBackdropClick);
    // Prevent body scroll when menu is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleBackdropClick);
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

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
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 overflow-x-hidden shadow-sm">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-4 py-2.5 md:py-3 mobile-container">
        <Link
          to="/"
          className="flex items-center gap-2 whitespace-nowrap"
        >
          <Logo className="w-8 h-8" />
          <span className="text-lg font-bold text-[#3b82f6]">Kush deals</span>
        </Link>

        {/* Desktop Search */}
        <div className="hidden md:block flex-1 px-4 max-w-2xl">
          <SearchSuggestions onSearch={(q) => navigate(`/shop?search=${encodeURIComponent(q)}`)} />
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center space-x-4">
          {publicLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className="text-sm text-gray-700 font-medium hover:text-orange-500 whitespace-nowrap"
            >
              {link.name}
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
                <div className="absolute right-0 top-full translate-y-2 w-72 sm:w-80 max-w-[calc(100vw-2rem)] glass rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-slide-up">
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
                className="btn-modern ripple"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Button - MOBILE-FIRST: Enhanced touch target (44x44px minimum) */}
        <button
          onClick={toggleMenu}
          className="md:hidden min-h-[44px] min-w-[44px] p-2.5 rounded-lg hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 transition-all duration-300 hover-scale ripple touch-manipulation flex-shrink-0 flex items-center justify-center"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={24} className="text-gradient" /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Backdrop */}
      {menuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Dropdown - MOBILE-FIRST: Enhanced with swipe gestures and better UX */}
      {menuOpen && (
        <div 
          ref={mobileMenuRef}
          className="md:hidden fixed inset-x-0 top-[70px] bottom-0 bg-white dark:bg-gray-900 shadow-2xl z-50 animate-bottom-sheet-up overflow-y-auto overflow-x-hidden"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{ 
            paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
            maxHeight: 'calc(100vh - 70px)'
          }}
        >
          {/* Swipe indicator */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          </div>

          {/* Search Bar */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <SearchSuggestions onSearch={(q) => { navigate(`/shop?search=${encodeURIComponent(q)}`); setMenuOpen(false); }} />
          </div>

          {/* Navigation Links - MOBILE-FIRST: Enhanced touch targets */}
          <div className="py-2">
            {publicLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMenuOpen(false)}
                className="block min-h-[44px] px-4 py-3 text-base text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 transition-all duration-300 touch-manipulation active:bg-gray-100 dark:active:bg-gray-800"
              >
                {link.name}
              </Link>
            ))}
          </div>
          
          {/* User Section */}
          {user ? (
            <>
              <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                <div className="flex items-center space-x-3">
                  {getAvatarUrl() ? (
                    <img src={getAvatarUrl()} alt="Avatar" className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-lg" />
                  ) : (
                    <div className="w-12 h-12 gradient-bg-1 text-white rounded-full flex items-center justify-center text-base font-semibold shadow-lg">
                      {getUserInitials()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold text-gray-900 dark:text-white truncate">{getUserDisplayName()}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>
              </div>

              {/* User Menu Items - MOBILE-FIRST: Enhanced touch targets */}
              <div className="py-2">
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center space-x-3 min-h-[44px] px-4 py-3 text-base text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 transition-all duration-300 touch-manipulation active:bg-gray-100 dark:active:bg-gray-800"
                >
                  <User className="w-5 h-5 flex-shrink-0" />
                  <span>Profile</span>
                </Link>
                {isSeller && (
                  <Link
                    to="/seller-dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="block min-h-[44px] px-4 py-3 text-base text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 transition-all duration-300 touch-manipulation active:bg-gray-100 dark:active:bg-gray-800"
                  >
                    Seller Dashboard
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMenuOpen(false)}
                    className="block min-h-[44px] px-4 py-3 text-base text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 transition-all duration-300 touch-manipulation active:bg-gray-100 dark:active:bg-gray-800"
                  >
                    Admin Dashboard
                  </Link>
                )}
                <Link
                  to="/orders"
                  onClick={() => setMenuOpen(false)}
                  className="block min-h-[44px] px-4 py-3 text-base text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/20 dark:hover:to-pink-900/20 transition-all duration-300 touch-manipulation active:bg-gray-100 dark:active:bg-gray-800"
                >
                  Orders
                </Link>
                <Link
                  to="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center space-x-3 min-h-[44px] px-4 py-3 text-base text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all duration-300 touch-manipulation active:bg-gray-100 dark:active:bg-gray-800"
                >
                  <Settings className="w-5 h-5 flex-shrink-0" />
                  <span>Settings</span>
                </Link>
              </div>

              {/* Logout Button */}
              <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
                <button
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 w-full min-h-[44px] px-4 py-3 text-base text-red-600 dark:text-red-400 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 dark:hover:from-red-900/20 dark:hover:to-pink-900/20 transition-all duration-300 touch-manipulation active:bg-red-100 dark:active:bg-red-900/30"
                >
                  <LogOut className="w-5 h-5 flex-shrink-0" />
                  <span>Logout</span>
                </button>
              </div>
            </>
          ) : (
            <div className="border-t border-gray-200 dark:border-gray-700 py-4 space-y-2">
              <Link
                to="/signup"
                onClick={() => setMenuOpen(false)}
                className="block min-h-[44px] px-4 py-3 text-center text-base font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg transition-all duration-300 touch-manipulation active:scale-95 mx-4 shadow-lg"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
