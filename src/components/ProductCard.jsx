import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Star, Truck } from "lucide-react";
import { useCart } from "../contexts/CartContext";

export default function ProductCard({ product, onAddToCart, viewMode = 'grid' }) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useCart();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);

  // Generate a consistent, pleasant color per product to tint the shadow.
  // Falls back gracefully when product fields are missing.
  const getShadowColor = () => {
    const key =
      String(product?.color || product?.category || product?.name || product?.id || 'prod')
        .toLowerCase();
    // Simple string hash -> hue [0, 360)
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    }
    const hue = hash % 360;
    const saturation = 82; // vibrant but soft
    const lightness = 72; // keeps the shadow pastel-like
    const alpha = 0.22;
    return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
  };

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
        className={`w-3.5 h-3.5 ${
          i < Math.floor(rating) ? 'text-[#ffb266] fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (viewMode === 'list') {
    return (
      <div 
        className="bg-white rounded border border-gray-200 overflow-hidden cursor-pointer transition-shadow product-shadow"
        style={{ ['--shadow-color']: getShadowColor() }}
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

  const isChoiceDeal = (product.rating || 0) >= 4.6;

  return (
    <div 
      className="group bg-white rounded-2xl border border-gray-200 overflow-hidden cursor-pointer transition-all flex flex-col h-full hover:border-[#ffd0b3] product-shadow"
      style={{ ['--shadow-color']: getShadowColor() }}
      onClick={() => navigate(`/product/${product.id}`)}
    >
      {/* Image */}
      <div className="relative aspect-square bg-[#fff7f2] border-b border-gray-100 overflow-hidden">
        {isChoiceDeal && (
          <span className="absolute top-3 left-3 bg-[#ff4747] text-white text-[10px] font-semibold uppercase tracking-wide px-3 py-1 rounded-full shadow-sm">
            Choice
          </span>
        )}
        <img
          src={product.images?.[selectedImage] || 'https://via.placeholder.com/300'}
          alt={product.name}
          className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Discount badge */}
        {product.originalPrice && product.originalPrice > product.price && (
          <div className="absolute top-3 right-3 bg-white text-[#ff4747] text-xs font-semibold px-2.5 py-1 rounded-full border border-[#ffd0b3] shadow-sm">
            -{Math.round(100 - (product.price / product.originalPrice) * 100)}%
          </div>
        )}

        {/* Wishlist button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleWishlistToggle(e);
          }}
          className={`absolute bottom-3 right-3 w-9 h-9 rounded-full flex items-center justify-center border border-white/70 backdrop-blur bg-white/80 transition-colors ${
            isInWishlist(product.id)
              ? 'text-[#ff4747]'
              : 'text-gray-600 hover:text-[#ff4747]'
          }`}
        >
          <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
        </button>

        {/* Image counter */}
        {product.images && product.images.length > 1 && (
          <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
            {selectedImage + 1}/{product.images.length}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="px-4 py-4 flex flex-col gap-3 flex-1">
        <h3 className="text-sm font-medium text-gray-800 line-clamp-2 min-h-[2.75rem] group-hover:text-[#ff4747] transition-colors">
          {product.name || 'Untitled Product'}
        </h3>

        {/* Price */}
        <div className="flex flex-wrap items-baseline gap-2">
          <div className="text-xl font-bold text-[#ff4747]">
            {getCurrencySymbol()}{formatPrice(product.price || 0)}
          </div>
          {product.originalPrice && product.originalPrice > product.price && (
            <div className="text-xs text-gray-400 line-through">
              {getCurrencySymbol()}{formatPrice(product.originalPrice)}
            </div>
          )}
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[#ff4747] bg-[#ffe8dc] px-2 py-0.5 rounded-full">
            Deal
          </span>
        </div>

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {renderStars(product.rating)}
            <span className="font-medium text-gray-600">{product.rating?.toFixed(1)}</span>
            <span className="text-gray-400">({product.reviewCount || 0})</span>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1 text-[#2dae6f] font-semibold">
            <Truck className="w-4 h-4" />
            Free shipping
          </span>
          <span>{product.sold ? `${product.sold}+ sold` : 'Popular'}</span>
        </div>
      </div>
    </div>
  );
}
