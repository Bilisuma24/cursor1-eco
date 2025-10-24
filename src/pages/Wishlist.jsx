import React from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingCart, Trash2, Eye } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import ProductCard from "../components/ProductCard";

export default function Wishlist() {
  const { wishlist, removeFromWishlist, addToCart } = useCart();

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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <Heart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Your wishlist is empty</h1>
              <p className="text-gray-600 mb-8">Save items you love for later by clicking the heart icon on any product.</p>
              <Link
                to="/shop"
                className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors duration-200 font-semibold"
              >
                Start Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
            <p className="text-gray-600 mt-2">{wishlist.length} item{wishlist.length !== 1 ? 's' : ''} saved</p>
          </div>
          <Link
            to="/shop"
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors duration-200 font-semibold"
          >
            Continue Shopping
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden group">
              {/* Image Container */}
              <div className="relative aspect-square overflow-hidden bg-gray-50">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                <div className="flex items-center space-x-1 mb-3">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span
                      key={i}
                      className={`text-sm ${
                        i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      ★
                    </span>
                  ))}
                  <span className="text-xs text-gray-500 ml-1">({product.reviewCount.toLocaleString()})</span>
                </div>

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
