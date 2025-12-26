import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, User, LogOut, ChevronDown, ShoppingCart } from "lucide-react";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
import SearchSuggestions from "./SearchSuggestions";
import { useUserRole } from "../hooks/useUserRole";
import { useCart } from "../contexts/CartContext";
import Logo from "./Logo";
import productsData from "../data/products.js";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { user, signOut, loading: authLoading } = useSupabaseAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const { userRole, isSeller, isAdmin } = useUserRole();
  const [categoriesMenuOpenDesktop, setCategoriesMenuOpenDesktop] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const categoriesMenuRefDesktop = useRef(null);
  const closeTimeoutRef = useRef(null);
  const hoveredCategoryTimeoutRef = useRef(null);

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setCategoriesMenuOpenDesktop(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setCategoriesMenuOpenDesktop(false);
      setHoveredCategory(null);
    }, 300);
  };

  const handleCategoryMouseEnter = (category) => {
    if (hoveredCategoryTimeoutRef.current) {
      clearTimeout(hoveredCategoryTimeoutRef.current);
      hoveredCategoryTimeoutRef.current = null;
    }
    setHoveredCategory(category);
  };

  const handleCategoryMouseLeave = () => {
    hoveredCategoryTimeoutRef.current = setTimeout(() => {
      setHoveredCategory(null);
    }, 100); // Short delay for subcategory transition
  };

  // Header category labels (AliExpress-style row under search)
  const headerCategories = [
    "Dollar Express",
    "Local shipping",
    "Home & Furniture",
    "Weekly deals",
    "Top Brands",
    "Choice",
    "FunTime",
    "More",
  ];

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const toggleUserDropdown = () => setUserDropdownOpen(!userDropdownOpen);

  const publicLinks = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

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

  const getUserDisplayName = () => {
    return user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  };

  const handleHeaderCategoryClick = (category) => {
    if (category === "All Categories") {
      navigate("/shop");
    } else {
      // Navigate to shop with category filter
      navigate(`/shop?category=${encodeURIComponent(category)}`);
    }
  };

  const handleGlobalSearch = (query) => {
    if (!query) return;
    const lowerQuery = query.toLowerCase();

    // 1. Direct Category Name Match
    const categoryMatch = productsData.categories.find(cat =>
      cat.name.toLowerCase() === lowerQuery
    );

    if (categoryMatch) {
      navigate(`/category/${encodeURIComponent(categoryMatch.name)}`);
      return;
    }

    // 2. Direct Subcategory Name Match
    for (const cat of productsData.categories) {
      const sub = cat.subcategories?.find(sub => sub.toLowerCase() === lowerQuery);
      if (sub) {
        navigate(`/category/${encodeURIComponent(cat.name)}?subcategory=${encodeURIComponent(sub)}`);
        return;
      }
    }

    // 3. Infer Category/Subcategory from Product Matches
    // Find products that match the search term
    const matchingProducts = productsData.products.filter(p =>
      p.name.toLowerCase().includes(lowerQuery) ||
      (p.description && p.description.toLowerCase().includes(lowerQuery)) ||
      (p.tags && p.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
    );

    if (matchingProducts.length > 0) {
      // Find the most frequent Category+Subcategory pair in the results
      const distribution = {};
      let maxCount = 0;
      let bestMatch = null;

      matchingProducts.forEach(p => {
        if (p.category && p.subcategory) {
          const key = `${p.category}|||${p.subcategory}`;
          distribution[key] = (distribution[key] || 0) + 1;

          if (distribution[key] > maxCount) {
            maxCount = distribution[key];
            bestMatch = { category: p.category, subcategory: p.subcategory };
          }
        }
      });

      // If we found a dominant subcategory, redirect there
      if (bestMatch) {
        console.log(`Smart Search: Redirecting "${query}" to ${bestMatch.category} > ${bestMatch.subcategory}`);
        navigate(`/category/${encodeURIComponent(bestMatch.category)}?subcategory=${encodeURIComponent(bestMatch.subcategory)}`);
        return;
      }
    }

    // 4. Default: Go to "Global" Category Search
    // This ensures we ALWAYS show the "Rich Category Layout" and never the generic "Shop List"
    navigate(`/category/Global?search=${encodeURIComponent(query)}`);
  };

  return (
    <nav className="bg-white border-b border-gray-200 relative z-[9999] shadow-sm overflow-visible">
      <div className="max-w-7xl mx-auto px-4 mobile-container">
        <div className="flex justify-between items-center pt-1.5 md:pt-3">
          {/* Logo & Name */}
          <Link
            to="/"
            className="flex items-center gap-1.5 whitespace-nowrap"
          >
            <Logo className="w-8 h-8 md:w-12 md:h-12" />
            <span className="text-base md:text-2xl text-[#3b82f6] leading-none font-bold">Kush deals</span>
          </Link>

          {/* Desktop Search (Hidden on Mobile) */}
          <div className="hidden md:block flex-1 px-4 max-w-2xl">
            <SearchSuggestions onSearch={handleGlobalSearch} />
          </div>

          {/* Actions: Cart & User (Desktop) / Cart & Menu (Mobile) */}
          <div className="flex items-center space-x-2 md:space-x-6">
            {/* Desktop User Menu (Hidden on Mobile) */}
            {user ? (
              <div className="hidden md:flex relative items-center gap-2" ref={dropdownRef}>
                <button
                  onClick={toggleUserDropdown}
                  className="flex items-center space-x-2 text-gray-700 hover:text-[#ff4747] transition-all"
                >
                  <div className="flex flex-col items-start">
                    <span className="text-[11px] text-gray-500 leading-none">Hi,</span>
                    <span className="text-sm font-semibold leading-tight">{getUserDisplayName()}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* User Dropdown */}
                {userDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
                    <Link
                      to="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>
                    {isSeller && (
                      <Link
                        to="/seller-dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Seller Dashboard
                      </Link>
                    )}
                    <Link
                      to="/orders"
                      onClick={() => setUserDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Orders
                    </Link>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-gray-700 hover:text-[#ff4747]"
                >
                  Sign In / Register
                </Link>
              </div>
            )}

            {/* Cart Icon - Visible on both Mobile and Desktop */}
            <Link to="/cart" className="relative p-1.5 text-gray-700 hover:text-[#ff4747] transition-colors">
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#ff4747] text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button - Visible only on Mobile */}
            <button
              onClick={toggleMenu}
              className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-all flex items-center justify-center"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        {/* Mobile Search Bar Row - Visible only on mobile */}
        <div className="md:hidden pb-1.5 pt-0.5">
          <SearchSuggestions onSearch={handleGlobalSearch} />
        </div>

        {/* Bottom Row: Desktop category strip integrated into header */}
        <div className="hidden md:flex items-center justify-between pb-3 mt-1">
          {/* All Categories pill with Sidebar Menu */}
          <div
            className="relative"
            ref={categoriesMenuRefDesktop}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <button
              type="button"
              className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-[#f2f2f2] hover:bg-gray-200 text-sm font-bold text-[#191919] transition-all whitespace-nowrap"
            >
              <Menu className="w-4 h-4" />
              <span>All Categories</span>
            </button>

            {categoriesMenuOpenDesktop && (
              <div
                className="absolute left-0 top-full w-56 bg-white shadow-2xl z-[99999] rounded-xl border border-gray-100"
                style={{ marginTop: '8px' }}
                onMouseEnter={handleMouseEnter}
              >
                {/* Transparent bridge to button */}
                <div className="absolute -top-2 left-0 right-0 h-2" />
                <div className="py-1">
                  {productsData.categories?.map((category, catIdx) => (
                    <div
                      key={category.id || `nav-cat-${catIdx}`}
                      className="relative"
                      onMouseEnter={() => handleCategoryMouseEnter(category)}
                      onMouseLeave={handleCategoryMouseLeave}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          navigate(`/shop?category=${encodeURIComponent(category.name)}`);
                          setCategoriesMenuOpenDesktop(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 hover:text-[#3b82f6] transition-colors flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base">{category.icon || '📦'}</span>
                          <span className="truncate">{category.name}</span>
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 -rotate-90 text-gray-400 group-hover:text-[#3b82f6]" />
                      </button>

                      {hoveredCategory?.id === category.id && category.subcategories && category.subcategories.length > 0 && (
                        <div
                          className="absolute left-full top-0 w-64 bg-white shadow-2xl z-[999999] rounded-xl border border-gray-100 py-2"
                          style={{ marginLeft: '4px' }}
                        >
                          {/* Transparent bridge to prevent closing when moving mouse */}
                          <div className="absolute -left-2 top-0 bottom-0 w-2" />

                          <div className="px-4 py-2 border-b border-gray-50 mb-1">
                            <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{category.name}</h3>
                          </div>
                          <div className="grid grid-cols-1 gap-0.5">
                            {category.subcategories.map((subcategory, idx) => (
                              <button
                                key={`nav-sub-${idx}`}
                                type="button"
                                onClick={() => {
                                  navigate(`/shop?category=${encodeURIComponent(category.name)}&subcategory=${encodeURIComponent(subcategory)}`);
                                  setCategoriesMenuOpenDesktop(false);
                                  setHoveredCategory(null);
                                }}
                                className="text-left px-4 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-50 hover:text-[#3b82f6] transition-colors"
                              >
                                {subcategory}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Category links - Spread across the remaining width */}
          <div className="flex-1 flex items-center justify-between ml-12">
            {headerCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleHeaderCategoryClick(cat)}
                className={`inline-flex items-center gap-1 text-[13px] font-bold transition-all whitespace-nowrap hover:opacity-80 ${cat === "Choice" ? 'text-[#ff4747]' : 'text-[#191919]'
                  }`}
              >
                {cat}
                {cat === "More" && <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div
          ref={mobileMenuRef}
          className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-2xl z-50 overflow-hidden"
        >
          <div className="flex flex-col">
            {/* User Profile Section (Mobile) */}
            {user && (
              <div className="px-4 py-4 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#3b82f6] text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {user?.email?.[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{getUserDisplayName()}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <div className="py-2">
              {publicLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-[#3b82f6] transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* User Actions */}
            {user ? (
              <div className="border-t border-gray-100 py-2">
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center space-x-2 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <User className="w-4 h-4" />
                  <span>Profile</span>
                </Link>
                {isSeller && (
                  <Link
                    to="/seller-dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Seller Dashboard
                  </Link>
                )}
                <Link
                  to="/orders"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Orders
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-gray-50"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="border-t border-gray-100 p-4">
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full py-3 text-center text-sm font-bold text-white bg-[#3b82f6] rounded-lg shadow-md active:scale-[0.98] transition-all"
                >
                  Sign In / Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
