import React, { useState } from "react";
import { Heart, ShoppingCart, Star, Truck, Shield } from "lucide-react";
import { useCart } from "../contexts/CartContext";

export default function ProductCard({ product, onAddToCart, viewMode = 'grid' }) {
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleAddToCart = () => {
    addToCart(product, 1);
    if (onAddToCart) onAddToCart(product);
  };

  const handleWishlistToggle = (e) => {
    e.stopPropagation();
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: product.currency || 'USD'
    }).format(price);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden group">
        <div className="flex">
          {/* Image */}
          <div className="w-48 h-48 flex-shrink-0">
            <img
              src={product.images[selectedImage]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2 hover:text-blue-600 transition-colors duration-200">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                
                {/* Rating and Reviews */}
                <div className="flex items-center space-x-2 mb-3">
                  <div className="flex items-center space-x-1">
                    {renderStars(product.rating)}
                  </div>
                  <span className="text-sm text-gray-500">({product.reviewCount} reviews)</span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-500">{product.sold}+ sold</span>
                </div>

                {/* Seller Info */}
                {product.seller && (
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-sm text-gray-600">by {product.seller.name}</span>
                    {product.seller.verified && (
                      <Shield className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                )}
              </div>

              {/* Price and Actions */}
              <div className="text-right ml-6">
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl font-bold text-red-600">
                      {formatPrice(product.price)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-lg text-gray-500 line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                    {product.discount && (
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                        -{product.discount}%
                      </span>
                    )}
                  </div>
                  
                  {/* Shipping Info */}
                  {product.shipping?.free && (
                    <div className="flex items-center space-x-1 text-green-600 mb-3">
                      <Truck className="w-4 h-4" />
                      <span className="text-sm font-medium">Free Shipping</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleWishlistToggle}
                    className={`p-2 rounded-lg border-2 transition-colors duration-200 ${
                      isInWishlist(product.id)
                        ? 'border-red-500 bg-red-50 text-red-600'
                        : 'border-gray-300 hover:border-red-500 hover:text-red-600'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={handleAddToCart}
                    className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium flex items-center space-x-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-white rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={product.images[selectedImage]}
        alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Discount Badge */}
        {product.discount && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            -{product.discount}%
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-2 right-2 p-2 rounded-full transition-all duration-200 ${
            isInWishlist(product.id)
              ? 'bg-red-500 text-white'
              : 'bg-white/80 text-gray-600 hover:bg-red-500 hover:text-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
        </button>

        {/* Image Thumbnails */}
        {product.images.length > 1 && (
          <div className="absolute bottom-2 left-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {product.images.slice(0, 3).map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`w-8 h-8 rounded border-2 ${
                  selectedImage === index ? 'border-blue-500' : 'border-white'
                }`}
              >
                <img src={image} alt="" className="w-full h-full object-cover rounded" />
              </button>
            ))}
          </div>
        )}

        {/* Quick Add to Cart (appears on hover) */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={handleAddToCart}
              className="bg-white text-gray-800 px-4 py-2 rounded-full font-medium hover:bg-gray-100 transition-colors duration-200 flex items-center space-x-2"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Quick Add</span>
            </button>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Product Name */}
        <h3 className="text-sm font-medium text-gray-800 mb-2 line-clamp-2 hover:text-blue-600 transition-colors duration-200">
          {product.name}
        </h3>

        {/* Rating and Reviews */}
        <div className="flex items-center space-x-2 mb-2">
          <div className="flex items-center space-x-1">
            {renderStars(product.rating)}
          </div>
          <span className="text-xs text-gray-500">({product.reviewCount})</span>
        </div>

        {/* Price */}
        <div className="mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-red-600">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
        </div>

        {/* Seller Info */}
        {product.seller && (
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-xs text-gray-600">by {product.seller.name}</span>
            {product.seller.verified && (
              <Shield className="w-3 h-3 text-blue-500" />
            )}
          </div>
        )}

        {/* Shipping Info */}
        {product.shipping?.free && (
          <div className="flex items-center space-x-1 mb-3">
            <Truck className="w-3 h-3 text-green-600" />
            <span className="text-xs text-green-600 font-medium">Free Shipping</span>
          </div>
        )}

        {/* Sold Count */}
        <div className="text-xs text-gray-500 mb-3">
          {product.sold}+ sold
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 text-sm flex items-center justify-center space-x-2"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  );
}
