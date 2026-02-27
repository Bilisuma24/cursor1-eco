import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, X, ChevronDown } from "lucide-react";

export default function SearchAndFilter({
  onSearch,
  onFilterChange,
  categories = [],
  filters = {},
  products = [] // Add products prop to get images
}) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [localFilters, setLocalFilters] = useState(filters);
  const navigate = useNavigate();

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {};
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  const activeFilterEntries = Object.entries(localFilters).filter(([_, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'boolean') return value;
    return value !== undefined && value !== null && value !== '';
  });

  const hasActiveFilters = activeFilterEntries.length > 0;

  return (
    <div className="z-40">
      <div className="max-w-7xl mx-auto py-0">
        {/* Subcategories List - Show when category is selected */}
        {localFilters.category && (() => {
          const selectedCategory = categories.find(c => c.name === localFilters.category);
          const subcategories = selectedCategory?.subcategories || [];

          // Subcategory icon mapping
          const subcategoryIcons = {
            // Electronics
            'Audio': '🎵',
            'Wearables': '⌚',
            'Photography': '📷',
            'Security': '🔒',
            'Computers': '💻',
            'Mobile': '📱',
            // Fashion
            'Clothing': '👕',
            'Bags': '👜',
            'Shoes': '👟',
            'Accessories': '🕶️',
            'Jewelry': '💍',
            'Watches': '⌚',
            // Home & Garden
            'Furniture': '🪑',
            'Decor': '🖼️',
            'Kitchen': '🍳',
            'Bathroom': '🚿',
            'Garden': '🌱',
            'Tools': '🔧',
            // Sports & Outdoors
            'Fitness': '💪',
            'Outdoor': '🏕️',
            'Sports': '⚽',
            'Camping': '⛺',
            'Hiking': '🥾',
            'Water Sports': '🏄',
            // Health & Beauty
            'Skincare': '🧴',
            'Makeup': '💄',
            'Hair Care': '💇',
            'Health': '💊',
            'Supplements': '💉',
            'Personal Care': '🧼',
            // Automotive
            'Car Parts': '🔩',
            'Accessories': '🚗',
            'Tools': '🔧',
            'Maintenance': '🛠️',
            'Tires': '⭕',
            'Electronics': '📡',
            // Toys & Games
            'Action Figures': '🤖',
            'Board Games': '🎲',
            'Video Games': '🎮',
            'Puzzles': '🧩',
            'Educational': '📚',
            'Outdoor Toys': '🪁',
            // Books & Media
            'Fiction': '📖',
            'Non-Fiction': '📘',
            'Educational': '📗',
            'Comics': '📕',
            'Magazines': '📰',
            'Digital': '💾',
            // Pet Supplies
            'Dogs': '🐕',
            'Cats': '🐈',
            'Birds': '🐦',
            'Fish': '🐠',
            'Small Pets': '🐹',
            'Pet Accessories': '🦴',
            // Baby & Kids
            'Clothing': '👶',
            'Toys': '🧸',
            'Feeding': '🍼',
            'Nursery': '🛏️',
            'Safety': '🛡️',
            'Educational': '📚',
            // Food & Beverages
            'Snacks': '🍪',
            'Beverages': '🥤',
            'Grocery': '🛒',
            'Organic': '🌿',
            'International': '🌍',
            'Specialty': '⭐',
            // Office Supplies
            'Stationery': '📝',
            'Furniture': '🪑',
            'Technology': '💻',
            'Organization': '📁',
            'Writing': '✏️',
            'Printing': '🖨️',
            // Jewelry & Watches
            'Necklaces': '📿',
            'Rings': '💍',
            'Earrings': '👂',
            'Bracelets': '📿',
            'Watches': '⌚',
            'Accessories': '✨',
            // Musical Instruments
            'Guitars': '🎸',
            'Pianos': '🎹',
            'Drums': '🥁',
            'Wind Instruments': '🎺',
            'Accessories': '🎧',
            'Recording': '🎤',
            // Art & Crafts
            'Painting': '🎨',
            'Drawing': '✏️',
            'Sewing': '🧵',
            'Scrapbooking': '📔',
            'Jewelry Making': '💎',
            'Supplies': '🖌️',
            // Luggage & Travel
            'Suitcases': '🧳',
            'Backpacks': '🎒',
            'Travel Accessories': '✈️',
            'Bags': '👜',
            'Organizers': '📦',
            'Gear': '🎒',
            // Industrial & Scientific
            'Tools': '🔧',
            'Equipment': '⚙️',
            'Safety': '🛡️',
            'Measurement': '📏',
            'Lab Supplies': '🧪',
            'Industrial': '🏭',
            // Home Improvement
            'Tools': '🔨',
            'Hardware': '🔩',
            'Paint': '🎨',
            'Flooring': '🏠',
            'Lighting': '💡',
            'Plumbing': '🚰',
          };

          if (subcategories.length > 0) {
            return (
              <div className="border-t border-gray-100 overflow-hidden mt-0">
                <div className="bg-[#f4f2f0] px-4 sm:px-6 md:px-8 py-10 md:py-14">
                  <div className="max-w-7xl mx-auto">
                    {/* Category Title */}
                    <div className="mb-10 px-4">
                      <h2 className="text-2xl md:text-[28px] font-bold text-[#191919] tracking-tight">
                        {localFilters.category}
                      </h2>
                    </div>

                    {/* Desktop Grid Layout */}
                    <div className="hidden md:grid md:grid-cols-8 gap-x-2 gap-y-12">
                      {subcategories.map((subcategory) => {
                        const icon = subcategoryIcons[subcategory] || '📦';
                        const subcategoryProduct = products.find(p => p.subcategory === subcategory);
                        const productImage = subcategoryProduct?.images?.[0];
                        const isSelected = localFilters.subcategory === subcategory;

                        return (
                          <button
                            key={subcategory}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                handleFilterChange('subcategory', '');
                              } else {
                                navigate(`/category/${encodeURIComponent(localFilters.category)}?subcategory=${encodeURIComponent(subcategory)}`);
                              }
                            }}
                            className="flex flex-col items-center gap-3 transition-all relative group"
                          >
                            <div className={`w-24 h-24 rounded-full bg-white shadow-sm flex items-center justify-center overflow-hidden transition-all duration-300 ${isSelected ? 'ring-4 ring-orange-500 shadow-lg scale-105' : 'group-hover:shadow-md'
                              }`}>
                              {productImage ? (
                                <img
                                  src={productImage}
                                  alt={subcategory}
                                  className="w-full h-full object-contain p-2"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    const fallback = e.target.nextElementSibling;
                                    if (fallback) fallback.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div
                                className={`w-full h-full flex items-center justify-center text-3xl bg-gray-50 ${productImage ? 'hidden' : 'flex'
                                  }`}
                              >
                                {icon}
                              </div>
                            </div>
                            <span className={`text-[9.5px] text-[#191919] text-center leading-tight font-bold max-w-[85px] transition-colors ${isSelected ? 'text-orange-600' : 'group-hover:text-orange-500'
                              }`}>
                              {subcategory}
                            </span>

                            {isSelected && (
                              <div className="absolute top-0 right-1 w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white z-10">
                                <X className="w-3 h-3" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Mobile version */}
                    <div className="md:hidden flex overflow-x-auto no-scrollbar gap-8 pb-4 px-4">
                      {subcategories.map((subcategory) => {
                        const icon = subcategoryIcons[subcategory] || '📦';
                        const subcategoryProduct = products.find(p => p.subcategory === subcategory);
                        const productImage = subcategoryProduct?.images?.[0];
                        const isSelected = localFilters.subcategory === subcategory;

                        return (
                          <button
                            key={subcategory}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                handleFilterChange('subcategory', '');
                              } else {
                                navigate(`/category/${encodeURIComponent(localFilters.category)}?subcategory=${encodeURIComponent(subcategory)}`);
                              }
                            }}
                            className="flex flex-col items-center gap-2.5 flex-shrink-0"
                          >
                            <div className={`w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center overflow-hidden ${isSelected ? 'ring-2 ring-orange-500' : ''
                              }`}>
                              {productImage ? (
                                <img src={productImage} alt={subcategory} className="w-full h-full object-contain p-1.5" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-2xl">
                                  {icon}
                                </div>
                              )}
                            </div>
                            <span className={`text-[9px] text-center font-bold max-w-[75px] leading-tight ${isSelected ? 'text-orange-600' : 'text-gray-700'}`}>
                              {subcategory}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}
      </div>
    </div>
  );
}
