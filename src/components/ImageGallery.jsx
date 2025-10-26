import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, X } from "lucide-react";

export default function ImageGallery({ 
  images = [], 
  selectedImage = 0, 
  onImageSelect = () => {},
  showThumbnails = true,
  showNavigation = true,
  autoplay = false,
  autoplayInterval = 4000,
  className = "",
  thumbnailSize = "w-20 h-20",
  mainImageSize = "aspect-square"
}) {
  const [currentImage, setCurrentImage] = useState(selectedImage);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isAutoplaying, setIsAutoplaying] = useState(autoplay);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setCurrentImage(selectedImage);
  }, [selectedImage]);

  useEffect(() => {
    if (!isAutoplaying || images.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, autoplayInterval);

    return () => clearInterval(interval);
  }, [isAutoplaying, images.length, autoplayInterval]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (isZoomed) {
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault();
            handlePrevious();
            break;
          case 'ArrowRight':
            e.preventDefault();
            handleNext();
            break;
          case 'Escape':
            e.preventDefault();
            handleCloseZoom();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isZoomed]);

  const handleImageSelect = (index) => {
    if (index !== currentImage) {
      setImageLoading(true);
      setImageError(false);
    }
    setCurrentImage(index);
    onImageSelect(index);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  const handlePrevious = () => {
    const newIndex = (currentImage - 1 + images.length) % images.length;
    handleImageSelect(newIndex);
  };

  const handleNext = () => {
    const newIndex = (currentImage + 1) % images.length;
    handleImageSelect(newIndex);
  };

  const handleZoom = () => {
    setIsZoomed(true);
  };

  const handleCloseZoom = () => {
    setIsZoomed(false);
  };

  if (!images || images.length === 0) {
    return (
      <div className={`${mainImageSize} bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <span className="text-gray-400">No images available</span>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Image Container */}
      <div className={`relative ${mainImageSize} bg-white rounded-lg overflow-hidden border group`}>
        {/* Error State */}
        {imageError && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2">📷</div>
              <div className="text-sm">Image not available</div>
            </div>
          </div>
        )}
        
        <img
          src={images[currentImage]}
          alt={`Product image ${currentImage + 1}`}
          className="w-full h-full object-cover cursor-zoom-in"
          onClick={handleZoom}
          onMouseEnter={() => setIsAutoplaying(false)}
          onMouseLeave={() => setIsAutoplaying(autoplay)}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />

        {/* Navigation Arrows */}
        {showNavigation && images.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Zoom Button */}
        <button
          onClick={handleZoom}
          className="absolute top-2 right-2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          aria-label="Zoom image"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Image Counter and Info */}
        {images.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
            {currentImage + 1} / {images.length}
          </div>
        )}
        
        {/* Image Quality Indicator */}
        <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
          <span className="inline-block w-2 h-2 bg-green-400 rounded-full mr-1"></span>
          HD
        </div>

        {/* Dots Indicator */}
        {images.length > 1 && (
          <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => handleImageSelect(index)}
                className={`w-2.5 h-2.5 rounded-full transition-colors duration-200 ${
                  index === currentImage ? 'bg-white' : 'bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail Images with Enhanced Scrolling */}
      {showThumbnails && images.length > 1 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">Image Choices ({images.length})</h4>
            <div className="text-xs text-gray-500">
              Click or scroll to browse
            </div>
          </div>
          <div className="relative">
            <div className="flex space-x-3 overflow-x-auto pb-2 scrollbar-hide" 
                 style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => handleImageSelect(index)}
                  className={`shrink-0 ${thumbnailSize} rounded-lg overflow-hidden border-2 transition-all duration-200 group ${
                    currentImage === index 
                      ? 'border-blue-500 ring-2 ring-blue-200 scale-105' 
                      : 'border-gray-200 hover:border-gray-300 hover:scale-105'
                  }`}
                >
                  <div className="relative">
                    <img 
                      src={image} 
                      alt={`Choice ${index + 1}`} 
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                    />
                    {currentImage === index && (
                      <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
            
            {/* Scroll indicators */}
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
          </div>
        </div>
      )}

      {/* Zoom Modal */}
      {isZoomed && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={handleCloseZoom}
        >
          <div className="relative max-w-7xl max-h-full">
            <img
              src={images[currentImage]}
              alt={`Zoomed product image ${currentImage + 1}`}
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={handleCloseZoom}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors duration-200"
              aria-label="Close zoom"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Navigation in zoom mode */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevious();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-200"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-200"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}