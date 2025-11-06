import React from 'react';
import productsData from '../data/products.js';

export default function ImageTestSimple() {
  const product = productsData.products[0]; // First product
  
  console.log('Product data:', product);
  console.log('Images array:', product?.images);
  console.log('First image URL:', product?.images?.[0]);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Simple Image Test</h2>
      
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold">{product?.name}</h3>
        <p className="text-sm text-gray-600">Images count: {product?.images?.length || 0}</p>
        <p className="text-sm text-gray-600">First image URL: {product?.images?.[0]}</p>
      </div>

      {/* Test 1: Direct image */}
      <div className="mb-4">
        <h4 className="font-medium mb-2">Test 1: Direct Image</h4>
        <div className="border rounded p-4 bg-white">
          <img
            src={product?.images?.[0]}
            alt="Test image"
            className="w-64 h-64 object-cover border rounded"
            onLoad={() => console.log('✅ Image loaded successfully')}
            onError={(e) => {
              console.error('❌ Image failed to load:', product?.images?.[0]);
              console.error('Error event:', e);
            }}
          />
        </div>
      </div>

      {/* Test 2: Multiple images */}
      <div className="mb-4">
        <h4 className="font-medium mb-2">Test 2: All Images</h4>
        <div className="grid grid-cols-3 gap-2">
          {product?.images?.slice(0, 6).map((image, index) => (
            <div key={index} className="border rounded p-2">
              <img
                src={image}
                alt={`Test ${index + 1}`}
                className="w-full h-32 object-cover rounded"
                onLoad={() => console.log(`✅ Image ${index + 1} loaded`)}
                onError={(e) => {
                  console.error(`❌ Image ${index + 1} failed:`, image);
                }}
              />
              <p className="text-xs text-gray-500 mt-1">Image {index + 1}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Test 3: Fallback image */}
      <div className="mb-4">
        <h4 className="font-medium mb-2">Test 3: Fallback Image</h4>
        <div className="border rounded p-4 bg-white">
          <img
            src="https://via.placeholder.com/300x300?text=Test+Image"
            alt="Fallback test"
            className="w-64 h-64 object-cover border rounded"
            onLoad={() => console.log('✅ Fallback image loaded')}
            onError={(e) => console.error('❌ Even fallback failed:', e)}
          />
        </div>
      </div>
    </div>
  );
}

