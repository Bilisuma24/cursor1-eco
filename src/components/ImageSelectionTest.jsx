import React, { useState } from 'react';
import ProductCard from './ProductCard';
import productsData from '../data/products.js';

export default function ImageSelectionTest() {
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Get a product with multiple images for testing
  const testProduct = productsData.products.find(p => p.images.length > 2) || productsData.products[0];
  
  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center">Image Selection Test</h1>
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-semibold mb-4">Test Product: {testProduct.name}</h2>
          <p className="text-gray-600 mb-4">
            This product has {testProduct.images.length} images. 
            Hover over the product card to see image thumbnails and click to switch between images.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Grid View */}
            <div>
              <h3 className="text-lg font-medium mb-4">Grid View</h3>
              <ProductCard product={testProduct} />
            </div>
            
            {/* List View */}
            <div>
              <h3 className="text-lg font-medium mb-4">List View</h3>
              <ProductCard product={testProduct} viewMode="list" />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4">All Products with Multiple Images</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {productsData.products
              .filter(p => p.images.length > 1)
              .slice(0, 6)
              .map(product => (
                <div key={product.id} className="border rounded-lg p-4">
                  <h3 className="font-medium text-sm mb-2 line-clamp-2">{product.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{product.images.length} images</p>
                  <ProductCard product={product} />
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}