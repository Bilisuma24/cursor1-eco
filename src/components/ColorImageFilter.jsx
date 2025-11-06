import React, { useState, useEffect } from "react";

export default function ColorImageFilter({ 
  product, 
  selectedColor, 
  onColorSelect, 
  selectedImage, 
  onImageSelect 
}) {
  const [colorImages, setColorImages] = useState({});

  useEffect(() => {
    if (!product || !product.colors) return;

    // Group images by color if they exist, otherwise use all images for all colors
    const colorImageMap = {};
    product.colors.forEach((color, index) => {
      // For now, we'll use all images for each color
      // In a real app, you might have different images for different colors
      colorImageMap[color] = product.images;
    });
    
    setColorImages(colorImageMap);
  }, [product]);

  const handleColorSelect = (color) => {
    onColorSelect(color);
    
    // Reset to first image when color changes
    if (colorImages[color] && colorImages[color].length > 0) {
      onImageSelect(0);
    }
  };

  if (!product.colors || product.colors.length <= 1) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Color Selection */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Color</h3>
        <div className="flex flex-wrap gap-2">
          {product.colors.map((color) => (
            <button
              key={color}
              onClick={() => handleColorSelect(color)}
              className={`px-4 py-2 border-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedColor === color
                  ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              {color}
            </button>
          ))}
        </div>
      </div>

      {/* Color-specific Image Count */}
      {selectedColor && colorImages[selectedColor] && (
        <div className="text-sm text-gray-600">
          {colorImages[selectedColor].length} image{colorImages[selectedColor].length !== 1 ? 's' : ''} available for {selectedColor}
        </div>
      )}
    </div>
  );
}