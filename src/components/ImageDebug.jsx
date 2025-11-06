import React, { useState } from 'react';
import productsData from '../data/products.js';

export default function ImageDebug() {
  const [selectedProduct, setSelectedProduct] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  
  const product = productsData.products[selectedProduct];
  
  if (!product) {
    return <div className="p-4 text-red-500">No product found</div>;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Image Debug Component</h2>
      
      {/* Product Selector */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Select Product:</label>
        <select 
          value={selectedProduct} 
          onChange={(e) => {
            setSelectedProduct(parseInt(e.target.value));
            setSelectedImage(0);
          }}
          className="border rounded px-3 py-2"
        >
          {productsData.products.map((p, index) => (
            <option key={p.id} value={index}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Product Info */}
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold">{product.name}</h3>
        <p className="text-sm text-gray-600">Images: {product.images?.length || 0}</p>
        <p className="text-sm text-gray-600">Current Image: {selectedImage + 1}</p>
      </div>

      {/* Image Display */}
      <div className="mb-4">
        <h4 className="font-medium mb-2">Main Image:</h4>
        <div className="border rounded p-4 bg-white">
          {product.images && product.images.length > 0 ? (
            <div className="space-y-4">
              <img
                src={product.images[selectedImage]}
                alt={`Product ${selectedImage + 1}`}
                className="w-64 h-64 object-cover border rounded"
                onLoad={() => console.log('Image loaded successfully')}
                onError={(e) => {
                  console.error('Image failed to load:', product.images[selectedImage]);
                  e.target.style.display = 'none';
                }}
              />
              <div className="text-sm text-gray-600">
                URL: {product.images[selectedImage]}
              </div>
            </div>
          ) : (
            <div className="text-red-500">No images available</div>
          )}
        </div>
      </div>

      {/* Image Thumbnails */}
      <div className="mb-4">
        <h4 className="font-medium mb-2">All Images ({product.images?.length || 0}):</h4>
        <div className="flex flex-wrap gap-2">
          {product.images?.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`w-16 h-16 border-2 rounded ${
                selectedImage === index ? 'border-blue-500' : 'border-gray-300'
              }`}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover rounded"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAyNEg0MFY0MEgyNFYyNFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Image URLs List */}
      <div className="mb-4">
        <h4 className="font-medium mb-2">Image URLs:</h4>
        <div className="bg-gray-100 p-4 rounded max-h-40 overflow-y-auto">
          {product.images?.map((image, index) => (
            <div key={index} className="text-xs text-gray-600 mb-1">
              {index + 1}: {image}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

