import React from 'react';

export default function BasicImage({ src, alt = "Image" }) {
  return (
    <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover rounded-lg"
        onLoad={() => console.log('✅ Image loaded:', src)}
        onError={(e) => {
          console.error('❌ Image failed:', src);
          e.target.style.display = 'none';
        }}
      />
    </div>
  );
}

