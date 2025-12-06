import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Star, Truck } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useImageColors } from "../hooks/useImageColors";

export default function ProductCard({ product, onAddToCart, viewMode = 'grid' }) {
  const { addToWishlist, removeFromWishlist, isInWishlist } = useCart();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  
  // Get current image URL for color extraction (grid view)
  const currentImageUrl = useMemo(() => {
    return product.images?.[selectedImage] || product.images?.[0] || 'https://via.placeholder.com/300';
  }, [product.images, selectedImage]);
  
  // Get first image URL for list view
  const listImageUrl = useMemo(() => {
    return product.images?.[0] || 'https://via.placeholder.com/200';
  }, [product.images]);
  
  // Extract colors from images (both views)
  const { colors: extractedColors } = useImageColors(currentImageUrl, 2);
  const { colors: listColors } = useImageColors(listImageUrl, 2);
  
  // Prepare colors for CSS (fallback to neutral if extraction fails)
  const glowColors = useMemo(() => {
    if (extractedColors && extractedColors.length >= 2 && extractedColors[0] !== 'rgb(200, 200, 200)') {
      return {
        primary: extractedColors[0] || 'rgb(255, 100, 100)',
        secondary: extractedColors[1] || 'rgb(255, 150, 150)',
      };
    }
    // Fallback to a subtle warm glow
    return {
      primary: 'rgb(255, 200, 200)',
      secondary: 'rgb(255, 220, 220)',
    };
  }, [extractedColors]);

  const listGlowColors = useMemo(() => {
    if (listColors && listColors.length >= 2 && listColors[0] !== 'rgb(200, 200, 200)') {
      return {
        primary: listColors[0] || 'rgb(255, 100, 100)',
        secondary: listColors[1] || 'rgb(255, 150, 150)',
      };
    }
    return {
      primary: 'rgb(255, 200, 200)',
      secondary: 'rgb(255, 220, 220)',
    };
  }, [listColors]);

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
      <div className="relative group" style={{ overflow: 'visible' }}>
        {/* Adaptive Glow Shadow for List View - Subtle on mobile */}
        <div 
          className="absolute -inset-2 sm:-inset-3 -z-10 opacity-[0.2] sm:opacity-[0.3] group-hover:opacity-[0.3] sm:group-hover:opacity-[0.5] transition-opacity duration-300 rounded product-glow-shadow"
          style={{
            background: `radial-gradient(ellipse 70% 50% at 20% 50%, ${listGlowColors.primary} 0%, ${listGlowColors.secondary} 30%, transparent 65%)`,
            pointerEvents: 'none',
          }}
        />
        <div 
          className="bg-white rounded border border-gray-200 overflow-hidden cursor-pointer hover:shadow-md transition-shadow relative z-0"
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
      </div>
    );
  }

  const isChoiceDeal = (product.rating || 0) >= 4.6;

  return (
    <div className="relative group" style={{ overflow: 'visible', isolation: 'isolate' }}>
      {/* Adaptive Glow Shadow - Subtle on mobile, more prominent on desktop */}
      <div 
        className="absolute -inset-2 md:-inset-8 -z-10 opacity-[0.25] md:opacity-[0.6] group-hover:opacity-[0.35] md:group-hover:opacity-[0.8] transition-opacity duration-300 rounded-none md:rounded-2xl product-glow-shadow"
        style={{
          background: `radial-gradient(ellipse 90% 70% at 50% 50%, ${glowColors.primary} 0%, ${glowColors.secondary} 40%, transparent 75%)`,
          pointerEvents: 'none',
          willChange: 'opacity',
        }}
      />
      
      {/* Product Card */}
      <div 
        className="group/card bg-white rounded-none md:rounded-2xl border-0 md:border border-gray-200 overflow-hidden cursor-pointer transition-all flex flex-col h-full hover:border-[#ffd0b3] hover:shadow-md md:hover:shadow-lg relative z-[1]"
        onClick={() => navigate(`/product/${product.id}`)}
      >
      {/* Image */}
      <div className="relative aspect-square bg-[#fff7f2] border-0 md:border-b border-gray-100 overflow-hidden w-full">
        {/* Seller Product Badge */}
        {(product.isSellerProduct || (product.isFromDatabase && product.seller_id)) && (
          <span className="absolute top-2 left-2 md:top-3 md:left-3 bg-green-600 text-white text-[9px] md:text-[10px] font-semibold px-2 md:px-3 py-0.5 md:py-1 rounded-full shadow-sm z-10 flex items-center gap-1">
            <span>🏪</span>
            <span className="hidden sm:inline">Seller</span>
          </span>
        )}
        {isChoiceDeal && (
          <span className={`absolute ${product.isFromDatabase ? 'top-2 right-2 md:top-3 md:right-3' : 'top-2 left-2 md:top-3 md:left-3'} bg-[#ff4747] text-white text-[9px] md:text-[10px] font-semibold uppercase tracking-wide px-2 md:px-3 py-0.5 md:py-1 rounded-full shadow-sm z-10`}>
            Choice
          </span>
        )}
        <img
          src={product.images?.[selectedImage] || 'https://via.placeholder.com/300'}
          alt={product.name}
          className="w-full h-full object-contain object-center p-2 md:p-6 group-hover:scale-105 transition-transform duration-300"
          style={{ objectPosition: 'center center' }}
        />
        
        {/* Discount badge */}
        {product.originalPrice && product.originalPrice > product.price && (
          <div className="absolute top-2 right-2 md:top-3 md:right-3 bg-white text-[#ff4747] text-[10px] md:text-xs font-semibold px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full border border-[#ffd0b3] shadow-sm">
            -{Math.round(100 - (product.price / product.originalPrice) * 100)}%
          </div>
        )}

        {/* Wishlist button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleWishlistToggle(e);
          }}
          className={`absolute bottom-2 right-2 md:bottom-3 md:right-3 w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center border border-white/70 backdrop-blur bg-white/80 transition-colors ${
            isInWishlist(product.id)
              ? 'text-[#ff4747]'
              : 'text-gray-600 hover:text-[#ff4747]'
          }`}
        >
          <Heart className={`w-3 h-3 md:w-4 md:h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
        </button>

        {/* Image counter */}
        {product.images && product.images.length > 1 && (
          <div className="absolute bottom-2 left-2 md:bottom-3 md:left-3 bg-black/60 text-white text-[9px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full">
            {selectedImage + 1}/{product.images.length}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="px-2 py-2 md:px-4 md:py-4 flex flex-col gap-1.5 md:gap-3 flex-1">
        <h3 className="text-xs md:text-sm font-medium text-gray-800 line-clamp-2 min-h-[2.5rem] md:min-h-[2.75rem] group-hover:text-[#ff4747] transition-colors leading-tight">
          {product.name || 'Untitled Product'}
        </h3>

        {/* Price */}
        <div className="flex flex-wrap items-baseline gap-1 md:gap-2">
          <div className="text-base md:text-xl font-bold text-[#ff4747]">
            {getCurrencySymbol()}{formatPrice(product.price || 0)}
          </div>
          {product.originalPrice && product.originalPrice > product.price && (
            <div className="text-[10px] md:text-xs text-gray-400 line-through">
              {getCurrencySymbol()}{formatPrice(product.originalPrice)}
            </div>
          )}
          <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[#ff4747] bg-[#ffe8dc] px-2 py-0.5 rounded-full">
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

        <div className="mt-auto flex items-center justify-between text-[10px] md:text-xs text-gray-500">
          <span className="hidden sm:flex items-center gap-1 text-[#2dae6f] font-semibold">
            <Truck className="w-3 h-3 md:w-4 md:h-4" />
            <span className="hidden md:inline">Free shipping</span>
          </span>
          <span className="text-[9px] md:text-xs">{product.sold ? `${product.sold}+ sold` : 'Popular'}</span>
        </div>
      </div>
    </div>
    </div>
  );
}
