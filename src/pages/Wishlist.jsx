import React from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Trash2, Eye, CheckCircle } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/SupabaseAuthContext";
import ProductCard from "../components/ProductCard";

export default function Wishlist() {
  const { wishlist, removeFromWishlist, addToCart } = useCart();
  const { user } = useAuth();

  const handleMoveToCart = (product) => {
    addToCart(product, 1);
    removeFromWishlist(product.id);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

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
                      className="bg-red-600 hover:bg-red-700 text-white px-6 sm:px-10 py-2.5 sm:py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base text-center touch-manipulation"
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
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-8">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Wishlist Summary</h2>
                  
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-2">Saved items</p>
                    <p className="text-2xl font-bold text-gray-900">0 items</p>
                  </div>

                  {/* Buyer Protection */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Buyer protection</h3>
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-600">
                        Get a full refund if the item is not as described or not delivered
                      </p>
                    </div>
                  </div>

                  {/* Tips */}
                  <div className="border-t border-gray-200 pt-6 mt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Tips</h3>
                    <ul className="space-y-2 text-sm text-gray-600">
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-3 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Wishlist</h1>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">{wishlist.length} item{wishlist.length !== 1 ? 's' : ''} saved</p>
          </div>
          <Link
            to="/shop"
            className="bg-blue-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:bg-blue-700 transition-colors duration-200 font-semibold text-sm sm:text-base text-center touch-manipulation"
          >
            Continue Shopping
          </Link>
        </div>

        {/* RESPONSIVE: 2 columns on mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {wishlist.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden group">
              {/* Image Container */}
              <div className="relative aspect-square overflow-hidden bg-gray-50">
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
                  <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg">
                    -{product.discount}%
                  </div>
                )}

                {/* Remove from Wishlist Button */}
                <button
                  onClick={() => removeFromWishlist(product.id)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all duration-200 shadow-lg"
                >
                  <Heart className="w-4 h-4 fill-current" />
                </button>

                {/* Quick Actions */}
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="flex space-x-2">
                    <Link
                      to={`/product/${product.id}`}
                      className="bg-white text-gray-800 px-4 py-2 rounded-full font-medium hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </Link>
                    <button
                      onClick={() => handleMoveToCart(product)}
                      className="bg-red-600 text-white px-4 py-2 rounded-full font-medium hover:bg-red-700 transition-colors duration-200 flex items-center space-x-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Add to Cart</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors duration-200">
                  {product.name}
                </h3>

                {/* Rating */}
                {product.rating && (
                  <div className="flex items-center space-x-1 mb-3">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span
                        key={i}
                        className={`text-sm ${
                          i < Math.floor(product.rating || 0) ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                    {product.reviewCount && (
                      <span className="text-xs text-gray-500 ml-1">({product.reviewCount.toLocaleString()})</span>
                    )}
                  </div>
                )}

                {/* Price */}
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-lg font-bold text-red-600">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-gray-500 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>

                {/* Seller Info */}
                {product.seller && (
                  <div className="text-xs text-gray-600 mb-3">
                    by {product.seller.name}
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2">
                  <Link
                    to={`/product/${product.id}`}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-center font-medium"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => handleMoveToCart(product)}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bulk Actions */}
        {wishlist.length > 0 && (
          <div className="mt-12 bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                <p className="text-gray-600">Manage your wishlist items</p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    wishlist.forEach(product => addToCart(product, 1));
                    // Clear wishlist after moving all to cart
                    wishlist.forEach(product => removeFromWishlist(product.id));
                  }}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold"
                >
                  Move All to Cart
                </button>
                <button
                  onClick={() => {
                    wishlist.forEach(product => removeFromWishlist(product.id));
                  }}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors duration-200 font-semibold"
                >
                  Clear Wishlist
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
