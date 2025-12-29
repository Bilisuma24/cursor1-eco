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
        className={`w-3 h-3 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
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
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2">
                  {product.name}
                </h3>
                <div className="flex items-center gap-1 mb-2">
                  {renderStars(product.rating || 0)}
                  <span className="text-xs text-gray-500">({product.reviewCount || 0})</span>
                </div>
              </div>
              <div>
                <div className="text-lg font-medium text-red-600">
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
  const discountPercent = hasSale ? Math.round(100 - (product.price / product.originalPrice) * 100) : 0;
  const hasCoupons = product.couponsApplicable !== false; // Default to true if not specified

  return (
    <div className="relative w-full">
      {/* Product Card - AliExpress Mobile App Exact Match */}
      <div
        className="bg-white overflow-hidden cursor-pointer flex flex-col h-full rounded-sm"
        onClick={() => navigate(`/product/${product.id}`)}
      >
        {/* Image Container - Square Frame, AliExpress Style - Smaller on mobile */}
        <div className="relative w-full aspect-square overflow-hidden bg-[#f5f5f5]">
          {/* Product Image - fills 100% of square frame */}
          <img
            src={product.images?.[selectedImage] || 'https://via.placeholder.com/300'}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Badges Container - Top Left, Horizontal Layout (AliExpress Style) */}
          <div className="absolute top-0.5 left-0.5 flex flex-row gap-0.5 z-10">
            {/* Choice Badge - Yellow rectangular (AliExpress yellow #FFD700) */}
            {isChoiceDeal && (
              <div className="bg-yellow-400 text-gray-900 text-[7px] font-semibold uppercase px-0.5 py-0.5 rounded leading-none">
                Choice
              </div>
            )}

            {/* SuperDeals Badge - Purple (AliExpress purple) */}
            {product.superDeals && (
              <div className="bg-purple-500 text-white text-[7px] font-semibold px-0.5 py-0.5 rounded leading-none">
                SuperDeals
              </div>
            )}
          </div>

          {/* Discount Percentage Badge - Top Right (circular white badge, AliExpress style) */}
          {hasSale && discountPercent > 0 && (
            <div className="absolute top-0.5 right-0.5 bg-white text-[#ff4747] text-[7px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm z-10">
              -{discountPercent}%
            </div>
          )}

          {/* Shopping Cart Icon - Bottom Right (white circular button, AliExpress style) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAddToCart(product);
            }}
            className="absolute bottom-1 right-1 w-6 h-6 rounded-full flex items-center justify-center bg-white shadow-lg z-10 active:scale-95 transition-transform"
            title="Add to cart"
          >
            <ShoppingCart className="w-3 h-3 text-gray-800" strokeWidth={2} />
          </button>
        </div>

        {/* Product Info - AliExpress Mobile App Style - Compact on mobile */}
        <div className="px-0.5 py-0.5 sm:px-1 sm:py-1 flex flex-col gap-0.5 flex-1">
          {/* Product Name - AliExpress small text, truncated */}
          <h3 className="text-[11px] sm:text-sm font-semibold text-gray-900 line-clamp-2 leading-tight min-h-[2rem]">
            {product.name || 'Untitled Product'}
          </h3>

          {/* Coupons Applicable Text - AliExpress style */}
          {hasCoupons && (
            <div className="text-[8px] text-gray-600 leading-tight">
              Coupons applicable
            </div>
          )}

          {/* Rating and Sold Count - AliExpress Format: "X sold ★ rating" or "X added to cart" */}
          {product.addedToCart ? (
            <div className="text-[8px] text-gray-600 leading-tight">
              {product.addedToCart.toLocaleString()} added to cart
            </div>
          ) : product.sold && product.rating ? (
            <div className="flex items-center gap-0.5 text-[8px] text-gray-600 leading-tight">
              <span>{product.sold.toLocaleString()} sold</span>
              <span className="text-yellow-400">★</span>
              <span>{product.rating.toFixed(1)}</span>
            </div>
          ) : product.sold ? (
            <div className="text-[8px] text-gray-600 leading-tight">
              {product.sold.toLocaleString()} sold
            </div>
          ) : null}

          {/* Price Section - AliExpress Mobile Format */}
          <div className="flex flex-col gap-0 mt-0.5">
            {/* Current Price - Bold red (AliExpress red #ff4747) */}
            <div className="text-base sm:text-lg font-bold text-[#ff4747] leading-tight flex items-baseline">
              <span className="text-[10px] sm:text-xs mr-0.5">{getCurrencySymbol()}</span>
              <span>{formatPrice(product.price || 0)}</span>
            </div>
            {product.originalPrice && product.originalPrice > product.price && (
              <>
                {/* Original Price - Strikethrough gray */}
                <div className="text-[10px] sm:text-xs text-gray-400 line-through leading-tight flex items-baseline opacity-80">
                  <span className="text-[8px] sm:text-[9px] mr-0.5">{getCurrencySymbol()}</span>
                  <span>{formatPrice(product.originalPrice)}</span>
                </div>
                {/* Discount Text - Small red (AliExpress style) */}
                <div className="text-[10px] sm:text-xs text-[#ff4747] leading-tight font-medium">
                  -{discountPercent}%
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
