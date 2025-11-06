import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Trash2, Eye, CheckCircle, ArrowUpDown, ArrowDown, ArrowUp, Calendar, Share2, AlertCircle, Loader2, DollarSign, Type, Menu } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/SupabaseAuthContext";
import { useToast } from "../contexts/ToastContext";

export default function Wishlist() {
  const { wishlist, removeFromWishlist, addToCart } = useCart();
  const { user } = useAuth();
  const { push: pushToast } = useToast();
  const [sortBy, setSortBy] = useState('date'); // 'date', 'price-low', 'price-high', 'name'
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleMoveToCart = async (product) => {
    try {
      await addToCart(product, 1);
      await removeFromWishlist(product.id);
      pushToast({ type: 'success', title: 'Moved to cart', message: `${product.name} added to cart` });
    } catch (error) {
      pushToast({ type: 'error', title: 'Error', message: 'Failed to move item to cart' });
    }
  };

  const handleRemove = async (id, productName) => {
    setRemovingId(id);
    try {
      await removeFromWishlist(id);
    } finally {
      setRemovingId(null);
    }
  };

  const handleClearWishlist = async () => {
    setProcessing(true);
    try {
      for (const product of wishlist) {
        await removeFromWishlist(product.id);
      }
      pushToast({ type: 'success', title: 'Wishlist cleared', message: 'All items removed' });
      setShowConfirmClear(false);
    } catch (error) {
      pushToast({ type: 'error', title: 'Error', message: 'Failed to clear wishlist' });
    } finally {
      setProcessing(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently added';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return 'Added today';
      if (diffDays === 2) return 'Added yesterday';
      if (diffDays <= 7) return `Added ${diffDays} days ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
    } catch {
      return 'Recently added';
    }
  };

  const sortedWishlist = useMemo(() => {
    const sorted = [...wishlist];
    switch (sortBy) {
      case 'price-low':
        return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'price-high':
        return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'name':
        return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      case 'date':
      default:
        return sorted.sort((a, b) => {
          const dateA = new Date(a.addedAt || a.created_at || 0);
          const dateB = new Date(b.addedAt || b.created_at || 0);
          return dateB - dateA;
        });
    }
  }, [wishlist, sortBy]);

  const totalValue = useMemo(() => {
    return wishlist.reduce((sum, item) => sum + (item.price || 0), 0);
  }, [wishlist]);

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 overflow-x-hidden">
        {/* RESPONSIVE FIX: Improved padding */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Left Column - Empty Wishlist Content */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6 lg:mb-8">Wishlist</h1>
                
                {/* Empty Wishlist Illustration */}
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="relative mb-8">
                    {/* Modern 3D-style Heart Illustration */}
                    <div className="relative w-64 h-64 mx-auto">
                      {/* Large Empty Heart */}
                      <svg width="200" height="200" viewBox="0 0 200 200" className="mx-auto">
                        {/* Main Heart */}
                        <path
                          d="M100 170 C50 150, 20 120, 20 85 C20 60, 40 40, 60 40 C75 40, 100 60, 100 60 C100 60, 125 40, 140 40 C160 40, 180 60, 180 85 C180 120, 150 150, 100 170 Z"
                          fill="#FCA5A5"
                          stroke="#EF4444"
                          strokeWidth="3"
                        />
                        {/* Empty indicator lines */}
                        <path
                          d="M70 85 L130 85 M100 70 L100 100"
                          stroke="#DC2626"
                          strokeWidth="3"
                          strokeLinecap="round"
                          opacity="0.5"
                        />
                        {/* Floating small hearts */}
                        <path
                          d="M40 50 C35 48, 32 45, 32 40 C32 35, 36 32, 40 32 C43 32, 45 34, 45 34 C45 34, 47 32, 50 32 C54 32, 58 35, 58 40 C58 45, 55 48, 50 50"
                          fill="#FEE2E2"
                          opacity="0.8"
                        />
                        <path
                          d="M155 55 C152 53, 150 50, 150 46 C150 42, 153 39, 156 39 C158 39, 160 41, 160 41 C160 41, 162 39, 164 39 C167 39, 170 42, 170 46 C170 50, 167 53, 164 55"
                          fill="#FEE2E2"
                          opacity="0.8"
                        />
                        {/* Cute face */}
                        <circle cx="85" cy="95" r="6" fill="#1F2937" />
                        <circle cx="115" cy="95" r="6" fill="#1F2937" />
                        <path
                          d="M75 115 Q100 125 125 115"
                          stroke="#1F2937"
                          strokeWidth="3"
                          fill="none"
                          strokeLinecap="round"
                        />
                      </svg>
                      
                      {/* Notification badge showing 0 */}
                      <div className="absolute top-4 right-4">
                        <div className="w-10 h-10 bg-pink-500 rounded-lg shadow-lg flex items-center justify-center transform -rotate-12">
                          <span className="text-white text-xs font-bold">0</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 px-3 sm:px-0">Your wishlist is empty</h2>
                  <p className="text-gray-600 mb-6 sm:mb-8 text-center max-w-md px-3 sm:px-4 text-sm sm:text-base">
                    Save items you love for later by clicking the heart icon on any product.
                  </p>
                  
                  {/* Action Buttons - RESPONSIVE */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 px-3 sm:px-0">
                    <Link
                      to="/shop"
                      className="bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white px-6 sm:px-10 py-2.5 sm:py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 text-sm sm:text-base text-center touch-manipulation"
                    >
                      Explore items
                    </Link>
                    {!user && (
                      <Link
                        to="/login"
                        className="bg-gray-900 hover:bg-gray-800 text-white px-10 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        Sign in
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 sticky top-8">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Wishlist Summary</h2>
                  
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Saved items</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">0 items</p>
                  </div>

                  {/* Buyer Protection */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Buyer protection</h3>
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Get a full refund if the item is not as described or not delivered
                      </p>
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Tips</h3>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li className="flex items-start space-x-2">
                        <span className="text-red-600">♥</span>
                        <span>Click the heart icon to save products</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-red-600">♥</span>
                        <span>Compare prices before buying</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <span className="text-red-600">♥</span>
                        <span>Get notified when prices drop</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden mobile-container">
      {/* MOBILE-FIRST: Improved padding with safe areas */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* RESPONSIVE: Stack header on mobile */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3 sm:gap-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">My Wishlist</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 sm:mt-2 text-sm sm:text-base">
                {wishlist.length} item{wishlist.length !== 1 ? 's' : ''} saved • Total value: {formatPrice(totalValue)}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <Link
                to="/shop"
                className="bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-all duration-200 font-semibold text-sm sm:text-base text-center touch-manipulation shadow-md hover:shadow-lg"
              >
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Sort and Filter Controls - Icon Menu */}
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-2 sm:p-3">
            <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                onClick={() => setSortBy('date')}
                className={`p-2 sm:p-2.5 rounded-lg transition-all ${
                  sortBy === 'date'
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="Sort by Date"
              >
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => setSortBy('price-low')}
                className={`p-2 sm:p-2.5 rounded-lg transition-all relative ${
                  sortBy === 'price-low'
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="Sort by Price: Low to High"
              >
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                <ArrowUp className="w-2 h-2 sm:w-2.5 sm:h-2.5 absolute -top-0.5 -right-0.5" />
              </button>
              <button
                onClick={() => setSortBy('price-high')}
                className={`p-2 sm:p-2.5 rounded-lg transition-all relative ${
                  sortBy === 'price-high'
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="Sort by Price: High to Low"
              >
                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                <ArrowDown className="w-2 h-2 sm:w-2.5 sm:h-2.5 absolute -top-0.5 -right-0.5" />
              </button>
              <button
                onClick={() => setSortBy('name')}
                className={`p-2 sm:p-2.5 rounded-lg transition-all ${
                  sortBy === 'name'
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="Sort by Name"
              >
                <Type className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* RESPONSIVE: 2 columns on mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1.5 sm:gap-4 lg:gap-6">
          {sortedWishlist.map((product) => (
            <div key={product.id} className="bg-white dark:bg-gray-800 rounded-md sm:rounded-xl shadow-sm sm:shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 overflow-hidden group flex flex-col h-full">
              {/* Image Container - Smaller on mobile */}
              <div className="relative aspect-square overflow-hidden bg-gray-50 flex-shrink-0 max-h-[140px] sm:max-h-none">
                <img
                  src={product.images?.[0] || `data:image/svg+xml;base64,${btoa(`<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="#f3f4f6"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="18" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>`)}`}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const currentSrc = e.target.src || '';
                    if (!currentSrc.includes('data:image/svg')) {
                      const svgPlaceholder = `data:image/svg+xml;base64,${btoa(`<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="#f3f4f6"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="18" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">Image Error</text></svg>`)}`;
                      e.target.src = svgPlaceholder;
                    } else {
                      e.target.style.display = 'none';
                    }
                  }}
                />
                
                {/* Discount Badge */}
                {product.discount && (
                  <div className="absolute top-1 left-1 sm:top-3 sm:left-3 bg-red-500 text-white text-[9px] sm:text-xs font-bold px-1 sm:px-2 py-0.5 sm:py-1 rounded shadow-lg">
                    -{product.discount}%
                  </div>
                )}

                {/* Remove from Wishlist Button */}
                <button
                  onClick={() => handleRemove(product.id, product.name)}
                  disabled={removingId === product.id}
                  className="absolute top-1 right-1 sm:top-3 sm:right-3 p-1 sm:p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed z-10 min-w-[24px] min-h-[24px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center"
                  title="Remove from wishlist"
                >
                  {removingId === product.id ? (
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
                  ) : (
                    <Heart className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                  )}
                </button>

                {/* Quick Actions - Hidden on mobile, shown on hover for desktop */}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:flex">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link
                      to={`/product/${product.id}`}
                      className="bg-white text-gray-800 px-3 sm:px-4 py-2 rounded-full font-medium hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-2 text-xs sm:text-sm"
                    >
                      <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>View</span>
                    </Link>
                    <button
                      onClick={() => handleMoveToCart(product)}
                      className="bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white px-3 sm:px-4 py-2 rounded-full font-medium transition-all duration-200 flex items-center space-x-2 text-xs sm:text-sm shadow-md"
                    >
                      <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Product Info - Flex grow to push actions to bottom */}
              <div className="p-2 sm:p-3 flex flex-col flex-grow">
                <h3 className="text-[10px] sm:text-sm font-semibold text-gray-900 dark:text-white mb-1 sm:mb-1.5 line-clamp-2 hover:text-blue-600 transition-colors duration-200 min-h-[1.75rem] sm:min-h-[2.5rem] leading-tight">
                  {product.name}
                </h3>

                {/* Price - Prominent on mobile */}
                <div className="flex flex-wrap items-baseline gap-0.5 sm:gap-2 mb-1 sm:mb-1.5">
                  <span className="text-xs sm:text-lg font-bold text-red-600 dark:text-red-400">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-[9px] sm:text-sm text-gray-500 dark:text-gray-400 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>

                {/* Date Added & Availability - Single line on mobile */}
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-1.5 flex-wrap">
                  <div className="flex items-center gap-0.5 text-[8px] sm:text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="w-2 h-2 sm:w-3 sm:h-3 flex-shrink-0" />
                    <span className="truncate">{formatDate(product.addedAt || product.created_at)}</span>
                  </div>
                  {product.stock !== undefined && (
                    <div className={`flex items-center gap-0.5 text-[8px] sm:text-xs ${
                      product.stock > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <AlertCircle className="w-2 h-2 sm:w-3 sm:h-3 flex-shrink-0" />
                      <span>{product.stock > 0 ? 'In Stock' : 'Out'}</span>
                    </div>
                  )}
                </div>

                {/* Rating - Compact, hidden on very small mobile */}
                {product.rating && (
                  <div className="hidden xs:flex items-center space-x-0.5 mb-1 sm:mb-2">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span
                        key={i}
                        className={`text-[8px] sm:text-xs ${
                          i < Math.floor(product.rating || 0) ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                    {product.reviewCount && (
                      <span className="text-[8px] sm:text-xs text-gray-500 ml-0.5">({product.reviewCount > 999 ? '999+' : product.reviewCount.toLocaleString()})</span>
                    )}
                  </div>
                )}

                {/* Seller Info - Hidden on mobile to save space */}
                {product.seller && (
                  <div className="hidden sm:block text-xs text-gray-600 dark:text-gray-400 mb-1.5 sm:mb-2 truncate">
                    by {product.seller.name}
                  </div>
                )}

                {/* Actions - Push to bottom */}
                <div className="flex flex-col gap-1 sm:gap-1.5 mt-auto pt-1.5">
                  {/* Primary Action - Full width on mobile, smaller */}
                  <button
                    onClick={() => handleMoveToCart(product)}
                    disabled={product.stock === 0}
                    className="w-full bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white py-2 sm:py-2.5 px-2 sm:px-3 rounded-md sm:rounded-lg transition-all duration-200 font-medium text-[10px] sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed min-h-[32px] sm:min-h-[40px] flex items-center justify-center shadow-md hover:shadow-lg"
                  >
                    <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
                    <span className="truncate">Add to Cart</span>
                  </button>
                  
                  {/* Secondary Actions - Row on mobile, better spacing */}
                  <div className="flex gap-1 sm:gap-1.5">
                    <Link
                      to={`/product/${product.id}`}
                      className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-1.5 sm:py-2 px-1.5 sm:px-2 rounded-md sm:rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 text-center font-medium text-[9px] sm:text-xs min-h-[28px] sm:min-h-[36px] flex items-center justify-center"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: product.name,
                            text: `Check out ${product.name} on my wishlist!`,
                            url: `${window.location.origin}/product/${product.id}`
                          }).catch(() => {});
                        } else {
                          navigator.clipboard.writeText(`${window.location.origin}/product/${product.id}`);
                          pushToast({ type: 'success', title: 'Link copied', message: 'Product link copied to clipboard' });
                        }
                      }}
                      className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 py-1.5 sm:py-2 px-1.5 sm:px-2 rounded-md sm:rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 text-[9px] sm:text-xs font-medium flex items-center justify-center gap-0.5 sm:gap-1 min-h-[28px] sm:min-h-[36px]"
                    >
                      <Share2 className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
                      <span className="hidden sm:inline">Share</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions - Compact size */}
        {wishlist.length > 0 && (
          <div className="mt-6 sm:mt-8 bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm sm:shadow-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
                <p className="text-gray-600 dark:text-gray-400 text-xs">Manage your wishlist items</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => setShowConfirmClear(true)}
                  disabled={processing}
                  className="bg-red-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Clear Wishlist
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal - Clear Wishlist */}
        {showConfirmClear && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Clear Wishlist?</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to remove all {wishlist.length} item{wishlist.length !== 1 ? 's' : ''} from your wishlist? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmClear(false)}
                  disabled={processing}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleClearWishlist}
                  disabled={processing}
                  className="flex-1 bg-red-600 text-white py-2.5 rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Clear All'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
