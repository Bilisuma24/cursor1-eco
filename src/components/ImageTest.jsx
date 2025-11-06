import React from 'react';

export default function ImageTest() {
  const testImages = [
    "https://images.unsplash.com/photo-1606220838315-056192d5e927?w=500&h=500&fit=crop",
    "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&h=500&fit=crop",
    "https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=500&h=500&fit=crop"
  ];

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Image Test</h2>
      <div className="grid grid-cols-3 gap-4">
        {testImages.map((image, index) => (
          <div key={index} className="border rounded p-4">
            <img 
              src={image} 
              alt={`Test image ${index + 1}`}
              className="w-full h-48 object-cover rounded"
              onLoad={() => console.log(`Image ${index + 1} loaded successfully`)}
              onError={(e) => console.error(`Image ${index + 1} failed to load:`, e)}
            />
            <p className="text-sm text-gray-600 mt-2">Image {index + 1}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

