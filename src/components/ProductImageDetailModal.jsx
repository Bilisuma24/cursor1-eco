import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Heart, ShoppingCart, Star, Truck, Shield, Check, Minus, Plus, Eye, ZoomIn, Share2, MessageCircle, Clock, Award, Users, TrendingUp } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import PriceAlertButton from './PriceAlertButton';

export default function ProductImageDetailModal({ 
  product, 
  isOpen, 
  onClose, 
  selectedImage = 0,
  onImageSelect = () => {}
}) {
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Handle mounting state
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      // Initialize selected options
      if (product?.colors && product.colors.length > 0) {
        setSelectedColor(product.colors[0]);
      }
      if (product?.sizes && product.sizes.length > 0) {
        setSelectedSize(product.sizes[0]);
      }
      setQuantity(1);
      setShowShareMenu(false);
      setAddedToCart(false);
    } else {
      // Delay unmounting to allow exit animation
      const timer = setTimeout(() => setMounted(false), 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, product?.colors, product?.sizes]);
  
  if (!mounted || !product) {
    return null;
  }

  const handleAddToCart = async () => {
    try {
      await addToCart(product, quantity, selectedColor, selectedSize);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (error) {
      console.error('Error adding to cart:', error);
      // Still show feedback even if there's an error
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    }
  };

  const handleWishlistToggle = () => {
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
        className={`w-4 h-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const handleImageNavigation = (direction) => {
    if (direction === 'prev') {
      const prevIndex = (selectedImage - 1 + product.images.length) % product.images.length;
      onImageSelect(prevIndex);
    } else {
      const nextIndex = (selectedImage + 1) % product.images.length;
      onImageSelect(nextIndex);
    }
  };

  const getColorValue = (colorName) => {
    const colorMap = {
      'Black': '#000000',
      'White': '#FFFFFF',
      'Red': '#FF0000',
      'Blue': '#0000FF',
      'Green': '#00FF00',
      'Yellow': '#FFFF00',
      'Orange': '#FFA500',
      'Purple': '#800080',
      'Pink': '#FFC0CB',
      'Brown': '#A52A2A',
      'Gray': '#808080',
      'Silver': '#C0C0C0',
      'Gold': '#FFD700',
      'Navy': '#000080',
      'Maroon': '#800000',
      'Teal': '#008080',
      'Cyan': '#00FFFF',
      'Magenta': '#FF00FF',
      'Lime': '#00FF00',
      'Indigo': '#4B0082',
      'Violet': '#8A2BE2',
      'Crimson': '#DC143C',
      'Turquoise': '#40E0D0',
      'Coral': '#FF7F50',
      'Salmon': '#FA8072',
      'Khaki': '#F0E68C',
      'Olive': '#808000',
      'Beige': '#F5F5DC',
      'Tan': '#D2B48C',
      'Burgundy': '#800020',
      'Charcoal': '#36454F',
      'Cream': '#FFFDD0',
      'Ivory': '#FFFFF0',
      'Pearl': '#F8F6F0',
      'Platinum': '#E5E4E2',
      'Rose': '#FFE4E1',
      'Lavender': '#E6E6FA',
      'Mint': '#F5FFFA',
      'Sky': '#87CEEB',
      'Forest': '#228B22',
      'Royal': '#4169E1',
      'Crimson': '#DC143C',
      'Emerald': '#50C878',
      'Ruby': '#E0115F',
      'Sapphire': '#0F52BA',
      'Amber': '#FFBF00',
      'Jade': '#00A86B',
      'Coral': '#FF7F50',
      'Turquoise': '#40E0D0',
      'Aqua': '#00FFFF',
      'Lime': '#BFFF00',
      'Fuchsia': '#FF00FF',
      'Hot Pink': '#FF69B4',
      'Deep Pink': '#FF1493',
      'Light Blue': '#ADD8E6',
      'Dark Blue': '#00008B',
      'Light Green': '#90EE90',
      'Dark Green': '#006400',
      'Light Red': '#FFB6C1',
      'Dark Red': '#8B0000',
      'Light Yellow': '#FFFFE0',
      'Dark Yellow': '#B8860B',
      'Light Purple': '#DDA0DD',
      'Dark Purple': '#800080',
      'Light Orange': '#FFE4B5',
      'Dark Orange': '#FF8C00',
      'Light Gray': '#D3D3D3',
      'Dark Gray': '#A9A9A9'
    };
    return colorMap[colorName] || '#E5E7EB';
  };

  return createPortal(
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-9999" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* AliExpress-style Header */}
        <div className="relative bg-gradient-to-r from-red-500 to-orange-500 text-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Eye className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Quick View</h2>
                <p className="text-orange-100 text-sm font-medium">Choose your options and add to cart</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="p-3 hover:bg-white/20 rounded-full transition-all duration-300 hover:scale-110"
                title="Share Product"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-3 hover:bg-white/20 rounded-full transition-all duration-300 hover:scale-110"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Share Menu */}
          {showShareMenu && (
            <div className="absolute top-16 right-4 bg-white rounded-lg shadow-xl p-3 z-10">
              <div className="flex space-x-3">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <MessageCircle className="w-4 h-4 text-blue-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Share2 className="w-4 h-4 text-green-600" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row flex-1 min-h-0">
          {/* Enhanced Image Section */}
          <div className="lg:w-1/2 p-6 flex items-center justify-center">
            <div className="relative group w-full max-w-lg">
              <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden shadow-lg">
                {(() => {
                  // Ensure we always have a valid image source
                  const imageSrc = product.images?.[selectedImage];
                  // Reject via.placeholder.com URLs even if they have https://
                  const isInvalidPlaceholder = imageSrc && typeof imageSrc === 'string' && imageSrc.includes('via.placeholder.com');
                  const hasValidImage = imageSrc && typeof imageSrc === 'string' && imageSrc.trim().length > 0 && (imageSrc.startsWith('http://') || imageSrc.startsWith('https://') || imageSrc.startsWith('data:image')) && !isInvalidPlaceholder;
                  const defaultPlaceholder = `data:image/svg+xml;base64,${btoa(`<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="#f3f4f6"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="18" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>`)}`;
                  
                  return (
                    <img
                      src={hasValidImage ? imageSrc : defaultPlaceholder}
                      alt={product.name}
                      className="w-full h-full object-cover transition-all duration-300 ease-in-out"
                      onError={(e) => {
                        // If image fails to load, use SVG placeholder
                        const currentSrc = e.target.src || '';
                        if (!currentSrc.includes('data:image/svg')) {
                          e.target.src = defaultPlaceholder;
                        }
                      }}
                    />
                  );
                })()}
                
                {/* Enhanced Navigation Arrows */}
                {product.images && product.images.length > 1 && (
                  <>
                    <button
                      onClick={() => handleImageNavigation('prev')}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 w-10 h-10 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleImageNavigation('next')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 w-10 h-10 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
                
                {/* Enhanced Image Counter */}
                {product.images && product.images.length > 1 && (
                  <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                    {selectedImage + 1} / {product.images.length}
                  </div>
                )}

                {/* Enhanced Discount Badge */}
                {product.discount && (
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">
                    -{product.discount}% OFF
                  </div>
                )}

                {/* Zoom Button */}
                <button
                  onClick={() => setIsZoomed(true)}
                  className="absolute top-3 right-3 bg-white/90 hover:bg-white text-gray-800 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              {/* Enhanced Thumbnail Navigation */}
              {product.images && product.images.length > 1 && (
                <div className="mt-4">
                  <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide">
                    {product.images.slice(0, 8).map((image, index) => (
                      <button
                        key={index}
                        onClick={() => onImageSelect(index)}
                        className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-300 hover:scale-105 ${
                          selectedImage === index 
                            ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={image || `data:image/svg+xml;base64,${btoa(`<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" fill="#f3f4f6"/></svg>`)}`}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            if (!e.target.src.includes('data:image/svg')) {
                              e.target.src = `data:image/svg+xml;base64,${btoa(`<svg width="64" height="64" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" fill="#f3f4f6"/></svg>`)}`;
                            }
                          }}
                        />
                      </button>
                    ))}
                    {product.images.length > 8 && (
                      <div className="shrink-0 w-16 h-16 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs text-gray-500 font-medium">
                        +{product.images.length - 8}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Product Info Section */}
          <div className="lg:w-1/2 p-6 overflow-y-auto flex items-center justify-center">
            <div className="w-full max-w-lg space-y-6">
              {/* Enhanced Product Title */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3 leading-tight">{product.name}</h3>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      {renderStars(product.rating)}
                    </div>
                    <span className="text-lg font-semibold text-gray-800">{product.rating}</span>
                    <span className="text-sm text-gray-600">({product.reviewCount.toLocaleString()} reviews)</span>
                  </div>
                  <div className="flex items-center space-x-1 text-orange-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-medium">{product.sold.toLocaleString()}+ sold</span>
                  </div>
                </div>
              </div>

              {/* AliExpress-style Price Section */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 rounded-2xl border-2 border-red-100 shadow-lg">
                <div className="flex items-center space-x-4 mb-3">
                  <span className="text-4xl font-bold text-red-600">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-2xl text-gray-500 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                  {product.discount && (
                    <div className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                      -{product.discount}% OFF
                    </div>
                  )}
                </div>
                {product.discount && (
                  <div className="text-lg text-red-700 font-bold mb-2">
                    🔥 Limited time offer! Save {formatPrice(product.originalPrice - product.price)}
                  </div>
                )}
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="font-semibold">{product.rating}</span>
                    <span>({product.reviewCount.toLocaleString()} reviews)</span>
                  </div>
                  <div className="flex items-center space-x-1 text-orange-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-semibold">{product.sold.toLocaleString()}+ sold</span>
                  </div>
                </div>
              </div>

              {/* Enhanced Seller Info */}
              {product.seller && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{product.seller.name.charAt(0)}</span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-900">{product.seller.name}</span>
                          {product.seller.verified && (
                            <div className="flex items-center space-x-1">
                              <Shield className="w-4 h-4 text-blue-500" />
                              <span className="text-xs text-blue-600 font-medium">Verified</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-current" />
                            <span>{product.seller.rating}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>{(product.seller.followers || 0).toLocaleString()} followers</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                      View Store
                    </button>
                  </div>
                </div>
              )}

              {/* Gender Display */}
              {product.gender && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Gender</h4>
                  <div className="inline-block px-4 py-2 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium">
                    {product.gender}
                  </div>
                </div>
              )}

              {/* Enhanced Color Selection */}
              {product.colors && product.colors.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    Choose Color {product.colors.length === 1 && <span className="text-gray-500 font-normal text-sm">({product.colors[0]})</span>}
                  </h4>
                  {product.colors.length > 1 ? (
                    <div className="grid grid-cols-4 gap-3">
                      {product.colors.slice(0, 8).map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`relative p-3 border-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 ${
                            selectedColor === color
                              ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200 shadow-lg'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ backgroundColor: getColorValue(color) }}
                            ></div>
                            <span>{color}</span>
                          </div>
                          {selectedColor === color && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                      {product.colors.length > 8 && (
                        <div className="p-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 flex items-center justify-center">
                          +{product.colors.length - 8} more
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium inline-flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: getColorValue(product.colors[0]) }}
                      ></div>
                      <span>{product.colors[0]}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Enhanced Size Selection */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">
                    Choose Size {product.sizes.length === 1 && <span className="text-gray-500 font-normal text-sm">({product.sizes[0]})</span>}
                  </h4>
                  {product.sizes.length > 1 ? (
                    <div className="grid grid-cols-6 gap-2">
                      {product.sizes.slice(0, 12).map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`relative p-3 border-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 ${
                            selectedSize === size
                              ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200 shadow-lg'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {size}
                          {selectedSize === size && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                      {product.sizes.length > 12 && (
                        <div className="p-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 flex items-center justify-center">
                          +{product.sizes.length - 12}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium inline-block">
                      {product.sizes[0]}
                    </div>
                  )}
                </div>
              )}

              {/* Enhanced Quantity */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">Quantity</h4>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="w-16 text-center py-3 font-semibold text-lg">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product.maxOrder || 10, quantity + 1))}
                      className="p-3 hover:bg-gray-50 transition-colors duration-200"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="text-sm text-gray-600">
                    Max: {product.maxOrder || 10} per order
                  </div>
                </div>
              </div>

              {/* Enhanced Features */}
              {product.features && product.features.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">Key Features</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {product.features.slice(0, 4).map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-gray-800">{feature}</span>
                      </div>
                    ))}
                    {product.features.length > 4 && (
                      <div className="text-sm text-gray-500 text-center py-2">
                        +{product.features.length - 4} more features available
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Enhanced Shipping Info */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                <div className="space-y-2">
                  {product.shipping?.free && (
                    <div className="flex items-center space-x-2 text-green-700">
                      <Truck className="w-5 h-5" />
                      <span className="font-semibold">Free shipping on orders over $50</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 text-gray-700">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">30-day return policy</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-700">
                    <Clock className="w-5 h-5" />
                    <span className="font-medium">Fast delivery: 2-5 business days</span>
                  </div>
                </div>
              </div>

              {/* AliExpress-style Action Buttons */}
              <div className="space-y-4">
                <div className="flex space-x-4">
                  <button
                    onClick={handleAddToCart}
                    className={`flex-1 py-5 px-8 rounded-2xl font-bold text-xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl ${
                      addedToCart 
                        ? 'bg-green-600 text-white scale-105 animate-bounce' 
                        : 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white hover:scale-105 hover:shadow-2xl'
                    }`}
                  >
                    <ShoppingCart className="w-7 h-7" />
                    <span>{addedToCart ? '✅ Added to Cart!' : '🛒 Add to Cart'}</span>
                  </button>
                  <button
                    onClick={handleWishlistToggle}
                    className={`px-8 py-5 rounded-2xl border-3 transition-all duration-300 flex items-center justify-center space-x-2 hover:scale-105 shadow-lg ${
                      isInWishlist(product.id)
                        ? 'border-red-500 bg-red-50 text-red-600 shadow-xl'
                        : 'border-gray-300 hover:border-red-500 hover:text-red-600 hover:bg-red-50'
                    }`}
                  >
                    <Heart className={`w-7 h-7 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                  </button>
                </div>
                {/* Price Alert Button */}
                <PriceAlertButton product={product} currentPrice={product.price} />
                
                <div className="grid grid-cols-2 gap-4">
                  <button className="py-4 px-6 border-2 border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all duration-300 font-medium flex items-center justify-center space-x-2 hover:scale-105">
                    <MessageCircle className="w-5 h-5" />
                    <span>Contact Seller</span>
                  </button>
                  <button className="py-4 px-6 border-2 border-gray-300 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all duration-300 font-medium flex items-center justify-center space-x-2 hover:scale-105">
                    <Share2 className="w-5 h-5" />
                    <span>Share Product</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Zoom Modal */}
        {isZoomed && (
          <div 
            className="fixed inset-0 bg-black/90 z-60 flex items-center justify-center p-4"
            onClick={() => setIsZoomed(false)}
          >
            <div className="relative max-w-7xl max-h-full">
              <img
                src={product.images?.[selectedImage] || `data:image/svg+xml;base64,${btoa(`<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="#f3f4f6"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="18" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>`)}`}
                alt={`Zoomed product image ${selectedImage + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg"
                onError={(e) => {
                  const currentSrc = e.target.src || '';
                  if (!currentSrc.includes('data:image/svg')) {
                    const svgPlaceholder = `data:image/svg+xml;base64,${btoa(`<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="#f3f4f6"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="18" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>`)}`;
                    e.target.src = svgPlaceholder;
                  }
                }}
              />
              <button
                onClick={() => setIsZoomed(false)}
                className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-3 rounded-full transition-colors duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
