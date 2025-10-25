import React, { useState } from "react";
import { X, ZoomIn } from "lucide-react";

export default function ImagePreviewGrid({ 
  images = [], 
  selectedImage = 0, 
  onImageSelect = () => {},
  showGrid = false,
  onToggleGrid = () => {}
}) {
  const [isGridOpen, setIsGridOpen] = useState(showGrid);

  const handleToggleGrid = () => {
    const newState = !isGridOpen;
    setIsGridOpen(newState);
    onToggleGrid(newState);
  };

  const handleImageClick = (index) => {
    onImageSelect(index);
    setIsGridOpen(false);
  };

  if (!images || images.length === 0) return null;

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={handleToggleGrid}
        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-2"
      >
        <ZoomIn className="w-4 h-4" />
        <span>View All Images ({images.length})</span>
      </button>

      {/* Grid Modal */}
      {isGridOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-6xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                All Product Images ({images.length})
              </h3>
              <button
                onClick={() => setIsGridOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid */}
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => handleImageClick(index)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      selectedImage === index
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Product image ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                    />
                    {selectedImage === index && (
                      <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                        <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                          Current
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Click any image to select it
                </span>
                <button
                  onClick={() => setIsGridOpen(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}