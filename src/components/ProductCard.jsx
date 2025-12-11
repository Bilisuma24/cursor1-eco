import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Star, Truck, ShoppingCart } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useImageColors } from "../hooks/useImageColors";

export default function ProductCard({ product, onAddToCart, onAdd, viewMode = 'grid' }) {
  const { addToWishlist, removeFromWishlist, isInWishlist, addToCart } = useCart();
  // Support both onAddToCart and onAdd props for compatibility
  const handleAddToCart = onAddToCart || onAdd || ((product) => {
    // Fallback: use CartContext addToCart if no handler provided
    addToCart(product, 1);
  });
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
        className={`w-3 h-3 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
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
  const hasSale = product.originalPrice && product.originalPrice > product.price;

  return (
    <div className="relative">
      {/* Product Card */}
      <div 
        className="bg-white border border-gray-200 overflow-hidden cursor-pointer flex flex-col h-full hover:shadow-md transition-shadow"
        onClick={() => navigate(`/product/${product.id}`)}
      >
      {/* Image Container - AliExpress Style */}
      <div className="relative border-b border-gray-200 overflow-hidden w-full aspect-square">
        {/* Product Image - fills 100% of 1:1 frame with no space */}
        <img
          src={product.images?.[selectedImage] || 'https://via.placeholder.com/300'}
          alt={product.name}
          className="w-full h-full object-cover"
          style={{ objectPosition: 'center center' }}
        />
        
        {/* Sale Badge - Top Left (rectangular red badge) */}
        {hasSale && (
          <div className="absolute top-2 left-2 bg-[#ff4747] text-white text-[10px] font-semibold px-2 py-0.5 z-10">
            Sale
          </div>
        )}
        
        {/* Choice Badge - Top Left (rectangular red badge, only if no Sale or if both should show) */}
        {isChoiceDeal && !hasSale && (
          <div className="absolute top-2 left-2 bg-[#ff4747] text-white text-[10px] font-semibold uppercase px-2 py-0.5 z-10">
            Choice
          </div>
        )}
        
        {/* Discount Percentage Badge - Top Right (circular white badge) */}
        {hasSale && (
          <div className="absolute top-2 right-2 bg-white text-[#ff4747] text-xs font-semibold w-10 h-10 rounded-full flex items-center justify-center border border-gray-200 shadow-sm z-10">
            -{Math.round(100 - (product.price / product.originalPrice) * 100)}%
          </div>
        )}
        
        {/* Shopping Cart Icon - Bottom Right (white circular button) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleAddToCart(product);
          }}
          className="absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all z-10"
          title="Add to cart"
        >
          <ShoppingCart className="w-5 h-5 text-gray-900" />
        </button>
      </div>

      {/* Product Info - AliExpress Style */}
      <div className="px-3 py-3 flex flex-col gap-2 flex-1">
        <h3 className="text-xs font-normal text-gray-900 line-clamp-2 leading-tight">
          {product.name || 'Untitled Product'}
        </h3>

        {/* Price */}
        <div className="flex flex-wrap items-baseline gap-2">
          <div className="text-base font-bold text-[#ff4747]">
            {getCurrencySymbol()}{formatPrice(product.price || 0)}
          </div>
          {product.originalPrice && product.originalPrice > product.price && (
            <div className="text-sm text-gray-400 line-through">
              {getCurrencySymbol()}{formatPrice(product.originalPrice)}
            </div>
          )}
        </div>

        {/* Rating and Sold Count - AliExpress Format */}
        {product.rating && (
          <div className="flex items-center gap-1 text-xs text-gray-600">
            {renderStars(product.rating)}
            <span className="font-medium text-gray-700">{product.rating?.toFixed(1)}</span>
            <span className="text-gray-500">|</span>
            <span className="text-gray-500">{product.sold ? `${product.sold} sold` : 'Popular'}</span>
          </div>
        )}

        {!product.rating && product.sold && (
          <div className="text-xs text-gray-500">
            {product.sold} sold
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
