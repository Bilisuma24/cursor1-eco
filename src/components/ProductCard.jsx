import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, ShoppingCart, Star, Truck, Shield, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import ImageGallery from "./ImageGallery";
import SimpleImageGallery from "./SimpleImageGallery";
import BasicImage from "./BasicImage";
import ProductImageDetailModal from "./ProductImageDetailModal";

export default function ProductCard({ product, onAddToCart, viewMode = 'grid' }) {
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useCart();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);


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

  const handleImageNavigation = (direction, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (direction === 'prev') {
      setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length);
    } else {
      setSelectedImage((prev) => (prev + 1) % product.images.length);
    }
  };

  const handleImageClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDetailModal(true);
  };

  const handleNavigateToProduct = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/product/${product.id}`);
  };

  const handleImageDetailClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDetailModal(true);
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
      <div 
        className="product-card bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden group cursor-pointer"
        onClick={(e) => {
          // Open modal when clicking on card, images, or text content (but not buttons)
          if (e.target === e.currentTarget || 
              e.target.closest('.product-info-area') ||
              e.target.closest('.product-image-area') ||
              e.target.tagName === 'IMG' ||
              e.target.closest('img')) {
            setShowDetailModal(true);
          }
        }}
      >
        <div className="flex">
          {/* Image Container */}
          <div className="relative w-48 h-48 shrink-0 group product-image-area">
            {/* Main Image - Clickable to open detail modal */}
            <div 
              className="w-full h-full cursor-pointer"
              onClick={handleImageClick}
            >
              <img
                src={product.images?.[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-300 ease-in-out group-hover:scale-105"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/400?text=Image+Error';
                }}
              />
            </div>
            
            {/* AliExpress-style overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center pointer-events-none">
              <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
                <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
                  <Eye className="w-6 h-6 text-gray-700" />
                </div>
              </div>
            </div>
            
            {/* Navigation Arrows - Only show if multiple images */}
            {product.images && product.images.length > 1 && (
              <>
                <button
                  onClick={(e) => handleImageNavigation('prev', e)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => handleImageNavigation('next', e)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}
            
            {/* Image Counter */}
            {product.images && product.images.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded z-10">
                {selectedImage + 1} / {product.images.length}
              </div>
            )}
            
            {/* Discount Badge */}
            {product.discount && (
              <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg z-10">
                -{product.discount}%
              </div>
            )}

            {/* Enhanced Detail Button */}
            <button
              onClick={handleImageDetailClick}
              className="absolute top-3 left-3 p-2.5 rounded-full bg-white/95 hover:bg-blue-500 text-gray-700 hover:text-white transition-all duration-300 shadow-lg z-10 hover:scale-110 backdrop-blur-sm"
              title="Quick View Details"
            >
              <Eye className="w-4 h-4" />
            </button>

            {/* Full Details Button */}
            <button
              onClick={handleNavigateToProduct}
              className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full bg-white/95 hover:bg-gray-800 hover:text-white text-gray-700 text-xs font-medium transition-all duration-300 shadow-lg z-10 hover:scale-105 backdrop-blur-sm"
              title="View Full Details"
            >
              Full Details
            </button>
{/**
 * here let's add mini product image galleray, when clicked changes the product image 
 */}
            {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleWishlistToggle(e);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 shadow-lg z-10 ${
            isInWishlist(product.id)
              ? 'bg-red-500 text-white'
              : 'bg-white/90 text-gray-600 hover:bg-red-500 hover:text-white'
          }`}
        >
              <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Mini Product Image Gallery for List View */}
          {product.images && product.images.length > 1 && (
            <div className="px-6 pb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500 font-medium">Image Choices</span>
                <span className="text-xs text-gray-400">{product.images.length} photos</span>
              </div>
              <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
                {product.images.slice(0, 8).map((image, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedImage(index);
                    }}
                    className={`shrink-0 w-10 h-10 rounded-md overflow-hidden border-2 transition-all duration-200 hover:scale-105 group relative ${
                      selectedImage === index 
                        ? 'border-blue-500 ring-2 ring-blue-200 shadow-md' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    title={`View image ${index + 1}`}
                  >
                    <img
                      src={image}
                      alt={`Product image ${index + 1}`}
                      className="w-full h-full object-cover group-hover:brightness-110 transition-all duration-200"
                    />
                    {selectedImage === index && (
                      <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
                {product.images.length > 8 && (
                  <div className="shrink-0 w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-medium border-2 border-dashed border-gray-300">
                    +{product.images.length - 8}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 p-6 product-info-area">
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
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleWishlistToggle(e);
                    }}
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
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleAddToCart();
                    }}
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
        
        {/* Product Detail Modal for List View */}
        <ProductImageDetailModal
          product={product}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          selectedImage={selectedImage}
          onImageSelect={setSelectedImage}
        />
      </div>
    );
  }

  return (
    <div 
      className="product-card bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        // Open modal when clicking on card, images, or text content (but not buttons)
        if (e.target === e.currentTarget || 
            e.target.closest('.product-info-area') ||
            e.target.closest('.product-image-area') ||
            e.target.tagName === 'IMG' ||
            e.target.closest('img')) {
          setShowDetailModal(true);
        }
      }}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-50 group product-image-area">
        {/* Main Image - Clickable to open detail modal */}
        <div 
          className="w-full h-full cursor-pointer"
          onClick={handleImageClick}
        >
          <img
            src={product.images?.[selectedImage]}
            alt={product.name}
            className="w-full h-full object-cover transition-all duration-300 ease-in-out group-hover:scale-105"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400?text=Image+Error';
            }}
          />
        </div>
        
        {/* AliExpress-style overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center pointer-events-none">
          <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
              <Eye className="w-6 h-6 text-gray-700" />
            </div>
          </div>
        </div>
        
        {/* Navigation Arrows - Only show if multiple images */}
        {product.images && product.images.length > 1 && (
          <>
            <button
              onClick={(e) => handleImageNavigation('prev', e)}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => handleImageNavigation('next', e)}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}
        
        {/* Image Counter */}
        {product.images && product.images.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded z-10">
            {selectedImage + 1} / {product.images.length}
          </div>
        )}
        
        {/* Discount Badge */}
        {product.discount && (
          <div className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded z-10">
            -{product.discount}%
          </div>
        )}

        {/* Enhanced Detail Button */}
        <button
          onClick={handleImageDetailClick}
          className="absolute top-3 left-3 p-2.5 rounded-full bg-white/95 hover:bg-blue-500 text-gray-700 hover:text-white transition-all duration-300 shadow-lg z-10 hover:scale-110 backdrop-blur-sm"
          title="Quick View Details"
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Full Details Button */}
        <button
          onClick={handleNavigateToProduct}
          className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full bg-white/95 hover:bg-gray-800 hover:text-white text-gray-700 text-xs font-medium transition-all duration-300 shadow-lg z-10 hover:scale-105 backdrop-blur-sm"
          title="View Full Details"
        >
          Full Details
        </button>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleWishlistToggle(e);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full transition-all duration-200 shadow-lg z-10 ${
            isInWishlist(product.id)
              ? 'bg-orange-500 text-white'
              : 'bg-white/80 text-gray-600 hover:bg-orange-500 hover:text-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
        </button>


        {/* Quick Add to Cart (appears on hover) */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddToCart();
              }}
              className="bg-orange-500 text-white px-4 py-2 rounded-full font-medium hover:bg-orange-600 transition-colors duration-200 flex items-center space-x-2"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Add to Cart</span>
            </button>
          </div>
        )}
      </div>

      {/* Mini Product Image Gallery */}
      {product.images && product.images.length > 1 && (
        <div className="px-4 pb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 font-medium">Image Choices</span>
            <span className="text-xs text-gray-400">{product.images.length} photos</span>
          </div>
          <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
            {product.images.slice(0, 6).map((image, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setSelectedImage(index);
                }}
                className={`shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all duration-200 hover:scale-105 group relative ${
                  selectedImage === index 
                    ? 'border-blue-500 ring-2 ring-blue-200 shadow-md' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                title={`View image ${index + 1}`}
              >
                <img
                  src={image}
                  alt={`Product image ${index + 1}`}
                  className="w-full h-full object-cover group-hover:brightness-110 transition-all duration-200"
                />
                {selectedImage === index && (
                  <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                  </div>
                )}
              </button>
            ))}
            {product.images.length > 6 && (
              <div className="shrink-0 w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-medium border-2 border-dashed border-gray-300">
                +{product.images.length - 6}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Product Info */}
      <div className="p-4 product-info-area">
        {/* Product Name */}
        <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors duration-200 min-h-10">
          {product.name}
        </h3>

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
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleAddToCart();
          }}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 text-sm flex items-center justify-center space-x-2"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Add to Cart</span>
        </button>

      </div>

      {/* Product Detail Modal */}
      <ProductImageDetailModal
        product={product}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        selectedImage={selectedImage}
        onImageSelect={setSelectedImage}
      />
    </div>
  );
}
