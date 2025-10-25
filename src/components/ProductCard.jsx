import React, { useState } from "react";
import { Heart, ShoppingCart, Star, Truck, Shield } from "lucide-react";
import { useCart } from "../contexts/CartContext";

export default function ProductCard({ product, onAddToCart, viewMode = 'grid' }) {
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useCart();
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || null);
  const [isHovered, setIsHovered] = useState(false);

  // Get current images based on selected color
  const getCurrentImages = () => {
    if (product.colorImages && selectedColor && product.colorImages[selectedColor]) {
      return product.colorImages[selectedColor];
    }
    return product.images || [];
  };

  const currentImages = getCurrentImages();

  // Convert color name to actual color value
  const getColorValue = (colorName) => {
    const colorMap = {
      'Black': '#000000',
      'White': '#FFFFFF',
      'Blue': '#3B82F6',
      'Red': '#EF4444',
      'Silver': '#C0C0C0',
      'Rose Gold': '#E8B4B8',
      'Brown': '#8B4513',
      'Tan': '#D2B48C',
      'Gray': '#6B7280',
      'Navy': '#1E3A8A',
      'Green': '#10B981',
      'Orange': '#F97316',
      'Space Gray': '#6B7280'
    };
    return colorMap[colorName] || '#6B7280';
  };

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
      <div className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden group">
        <div className="flex">
          {/* Image Container */}
          <div className="relative w-48 h-48 flex-shrink-0 bg-gray-50">
            <img
              src={currentImages[selectedImage] || currentImages[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            
            {/* Discount Badge */}
            {product.discount && (
              <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg">
                -{product.discount}%
              </div>
            )}

            {/* Wishlist Button */}
            <button
              onClick={handleWishlistToggle}
              className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 shadow-lg ${
                isInWishlist(product.id)
                  ? 'bg-red-500 text-white'
                  : 'bg-white/90 text-gray-600 hover:bg-red-500 hover:text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            <div className="flex justify-between items-start h-full">
              <div className="flex-1 pr-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors duration-200 line-clamp-2">
                  {product.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                
                {/* Rating and Reviews */}
                <div className="flex items-center space-x-3 mb-3">
                  <div className="flex items-center space-x-1">
                    {renderStars(product.rating)}
                    <span className="text-sm font-medium text-gray-700 ml-1">{product.rating}</span>
                  </div>
                  <span className="text-sm text-gray-500">({product.reviewCount.toLocaleString()} reviews)</span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-500">{product.sold.toLocaleString()}+ sold</span>
                </div>

                {/* Seller Info */}
                {product.seller && (
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-sm text-gray-600">Sold by</span>
                    <span className="text-sm font-medium text-gray-900">{product.seller.name}</span>
                    {product.seller.verified && (
                      <div className="flex items-center space-x-1">
                        <Shield className="w-4 h-4 text-blue-500" />
                        <span className="text-xs text-blue-600 font-medium">Verified</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Features */}
                {product.features && product.features.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {product.features.slice(0, 3).map((feature, index) => (
                      <span key={index} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md font-medium">
                        {feature}
                      </span>
                    ))}
                  </div>
                )}

                {/* Shipping Info */}
                {product.shipping?.free && (
                  <div className="flex items-center space-x-1 text-green-600 mb-3">
                    <Truck className="w-4 h-4" />
                    <span className="text-sm font-medium">Free Shipping</span>
                  </div>
                )}
              </div>

              {/* Price and Actions */}
              <div className="flex flex-col justify-between items-end min-w-[200px]">
                <div className="text-right mb-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl font-bold text-red-600">
                      {formatPrice(product.price)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-lg text-gray-500 line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>
                  
                  {product.discount && (
                    <div className="inline-block bg-red-100 text-red-800 px-2 py-1 rounded-md text-sm font-medium">
                      Save {formatPrice(product.originalPrice - product.price)}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleWishlistToggle}
                    className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                      isInWishlist(product.id)
                        ? 'border-red-500 bg-red-50 text-red-600'
                        : 'border-gray-300 hover:border-red-500 hover:text-red-600 hover:bg-red-50'
                    }`}
                    title={isInWishlist(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  >
                    <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={handleAddToCart}
                    className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-all duration-200 font-semibold flex items-center space-x-2 shadow-lg hover:shadow-xl"
                  >
                    <ShoppingCart className="w-5 h-5" />
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
      className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <img
          src={currentImages[selectedImage] || currentImages[0]}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Discount Badge */}
        {product.discount && (
          <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded">
            -{product.discount}%
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistToggle}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 shadow-lg z-10 ${
            isInWishlist(product.id)
              ? 'bg-orange-500 text-white'
              : 'bg-white/80 text-gray-600 hover:bg-orange-500 hover:text-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
        </button>

        {/* Image Thumbnails */}
        {currentImages.length > 1 && (
          <div className="absolute bottom-3 left-3 right-3 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {currentImages.slice(0, 3).map((image, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(index);
                }}
                className={`w-8 h-8 rounded border-2 shadow-sm ${
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
              className="bg-orange-500 text-white px-4 py-2 rounded-full font-medium hover:bg-orange-600 transition-colors duration-200 flex items-center space-x-2"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Add to Cart</span>
            </button>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        {/* Product Name */}
        <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors duration-200 min-h-[2.5rem]">
          {product.name}
        </h3>

        {/* Color Selection */}
        {product.colors && product.colors.length > 1 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {product.colors.map((color) => (
                <button
                  key={color}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedColor(color);
                    setSelectedImage(0);
                  }}
                  className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
                    selectedColor === color
                      ? 'border-blue-500 scale-110'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: getColorValue(color) }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}

        {/* Rating and Reviews */}
        <div className="flex items-center space-x-2 mb-3">
          <div className="flex items-center space-x-1">
            {renderStars(product.rating)}
            <span className="text-xs font-medium text-gray-700 ml-1">{product.rating}</span>
          </div>
          <span className="text-xs text-gray-500">({product.reviewCount.toLocaleString()})</span>
        </div>

        {/* Price Section */}
        <div className="mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-orange-600">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          {product.discount && (
            <div className="text-xs text-green-600 font-medium">
              Save {formatPrice(product.originalPrice - product.price)}
            </div>
          )}
        </div>

        {/* Seller Info */}
        {product.seller && (
          <div className="flex items-center space-x-2 mb-3">
            <span className="text-xs text-gray-600">by</span>
            <span className="text-xs font-medium text-gray-900">{product.seller.name}</span>
            {product.seller.verified && (
              <div className="flex items-center space-x-1">
                <Shield className="w-3 h-3 text-blue-500" />
                <span className="text-xs text-blue-600 font-medium">Verified</span>
              </div>
            )}
          </div>
        )}

        {/* Features */}
        {product.features && product.features.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.features.slice(0, 2).map((feature, index) => (
              <span key={index} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md font-medium">
                {feature}
              </span>
            ))}
          </div>
        )}

        {/* Shipping and Sold Info */}
        <div className="flex items-center justify-between mb-3">
          {product.shipping?.free && (
            <div className="flex items-center space-x-1">
              <Truck className="w-3 h-3 text-green-600" />
              <span className="text-xs text-green-600 font-medium">Free Shipping</span>
            </div>
          )}
          <div className="text-xs text-gray-500">
            {product.sold.toLocaleString()}+ sold
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={handleAddToCart}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 text-sm flex items-center justify-center space-x-2"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  );
}
