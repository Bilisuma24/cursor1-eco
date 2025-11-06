import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Star } from "lucide-react";
import { useCart } from "../contexts/CartContext";

export default function ProductCard({ product, onAddToCart, viewMode = 'grid' }) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useCart();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);

  const handleWishlistToggle = async (e) => {
    e.stopPropagation();
    try {
      if (isInWishlist(product.id)) {
        await removeFromWishlist(product.id);
      } else {
        await addToWishlist(product);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    }
  };

  const formatPrice = (price) => {
    const currency = product.currency || 'ETB';
    if (currency === 'ETB') {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(price);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  };

  const getCurrencySymbol = () => {
    return product.currency || 'ETB';
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < Math.floor(rating) ? 'text-orange-500 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (viewMode === 'list') {
    return (
      <div 
        className="bg-white rounded border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => navigate(`/product/${product.id}`)}
      >
        <div className="flex">
          <div className="relative w-32 h-32 sm:w-48 sm:h-48 shrink-0 border border-gray-100 bg-white rounded overflow-hidden">
            <img
              src={product.images?.[0] || 'https://via.placeholder.com/200'}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.discount && (
              <div className="absolute top-1 left-1 bg-red-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded">
                -{product.discount}%
              </div>
            )}
          </div>
          <div className="flex-1 p-3 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-normal text-gray-900 line-clamp-2 mb-2">
                {product.name}
              </h3>
              <div className="flex items-center gap-1 mb-2">
                {renderStars(product.rating || 0)}
                <span className="text-xs text-gray-500">({product.reviewCount || 0})</span>
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-red-600">
                {getCurrencySymbol()}{formatPrice(product.price || 0)}
              </div>
              {product.originalPrice && (
                <div className="text-xs text-gray-400 line-through">
                  {getCurrencySymbol()}{formatPrice(product.originalPrice)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-white rounded border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow flex flex-col h-full"
      onClick={() => navigate(`/product/${product.id}`)}
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-50 border border-gray-100 bg-white rounded overflow-hidden">
        <img
          src={product.images?.[selectedImage] || 'https://via.placeholder.com/300'}
          alt={product.name}
          className="w-full h-full object-cover"
        />
        
        {/* Discount badge */}
        {product.discount && (
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded">
            -{product.discount}%
          </div>
        )}

        {/* Wishlist button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleWishlistToggle(e);
          }}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            isInWishlist(product.id)
              ? 'bg-orange-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
        </button>

        {/* Image counter */}
        {product.images && product.images.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
            {selectedImage + 1}/{product.images.length}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3 flex flex-col flex-grow">
        <h3 className="text-sm font-normal text-gray-900 line-clamp-2 mb-2 min-h-[2.5rem]">
          {product.name || 'Untitled Product'}
        </h3>

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-1 mb-2">
            {renderStars(product.rating)}
            <span className="text-xs text-gray-500">({product.reviewCount || 0})</span>
          </div>
        )}

        {/* Price */}
        <div className="mt-auto">
          <div className="text-lg font-bold text-red-600 mb-1">
            {getCurrencySymbol()}{formatPrice(product.price || 0)}
          </div>
          {product.originalPrice && product.originalPrice > product.price && (
            <div className="text-xs text-gray-400 line-through">
              {getCurrencySymbol()}{formatPrice(product.originalPrice)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
