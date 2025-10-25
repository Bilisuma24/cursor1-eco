import React, { useState } from 'react';
import productsData from '../data/products.json';

export default function ColorImageDemo() {
  const [selectedProduct, setSelectedProduct] = useState(0);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);

  const product = productsData.products[selectedProduct];

  // Get current images based on selected color
  const getCurrentImages = () => {
    if (product?.colorImages && selectedColor && product.colorImages[selectedColor]) {
      return product.colorImages[selectedColor];
    }
    return product?.images || [];
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

  // Initialize selected color when product changes
  React.useEffect(() => {
    if (product?.colors?.length > 0) {
      setSelectedColor(product.colors[0]);
      setSelectedImage(0);
    }
  }, [selectedProduct]);

  if (!product) return null;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Color-Based Image Selection Demo</h1>
      
      {/* Product Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Product:
        </label>
        <select
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(parseInt(e.target.value))}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          {productsData.products.map((p, index) => (
            <option key={p.id} value={index}>
              {p.name} {p.colors?.length > 1 ? `(${p.colors.length} colors)` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Info */}
        <div>
          <h2 className="text-2xl font-bold mb-4">{product.name}</h2>
          <p className="text-gray-600 mb-4">{product.description}</p>
          
          {/* Color Selection */}
          {product.colors && product.colors.length > 1 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Available Colors:</h3>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      setSelectedColor(color);
                      setSelectedImage(0);
                    }}
                    className={`flex items-center space-x-2 px-4 py-2 border rounded-md transition-all duration-200 ${
                      selectedColor === color
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-300"
                      style={{ backgroundColor: getColorValue(color) }}
                    />
                    <span>{color}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Image Thumbnails */}
          {currentImages.length > 1 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-3">Images for {selectedColor}:</h3>
              <div className="flex space-x-2 overflow-x-auto">
                {currentImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      selectedImage === index ? 'border-blue-500' : 'border-gray-200'
                    }`}
                  >
                    <img src={image} alt={`${selectedColor} variant ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Image Display */}
        <div>
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
            <img
              src={currentImages[selectedImage] || currentImages[0]}
              alt={`${product.name} - ${selectedColor}`}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Showing: <span className="font-semibold">{selectedColor}</span> variant
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Image {selectedImage + 1} of {currentImages.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}