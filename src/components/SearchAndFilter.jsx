import React, { useEffect, useState } from "react";
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
    <div className="sticky top-16 z-40 bg-white/90 backdrop-blur supports-backdrop-filter:bg-white/60 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-0">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="px-3 sm:px-4 md:px-6 pt-3 sm:pt-4 pb-0">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search for products, brands, and more..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-inner"
                />
              </div>
              <button
                type="submit"
                className="h-10 px-6 rounded-xl bg-orange-500 text-white text-sm font-semibold shadow-sm hover:bg-orange-600 transition-colors"
              >
                Search
              </button>
            </form>

            <div className="md:hidden space-y-2">
              <button
                type="button"
                onClick={() => setIsFilterOpen((prev) => !prev)}
                className="w-full inline-flex items-center justify-between rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-700 shadow-sm"
              >
                <span className="inline-flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  <span>{hasActiveFilters ? `Filters (${activeFilterEntries.length})` : 'Filters'}</span>
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
              </button>

              {isFilterOpen && (
                <div className="border border-gray-200 rounded-xl bg-gray-50 px-3 py-3 space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                    <select
                      value={localFilters.category || ''}
                      onChange={(e) => handleFilterChange('category', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    >
                      <option value=""></option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Subcategory</label>
                    <select
                      value={localFilters.subcategory || ''}
                      onChange={(e) => handleFilterChange('subcategory', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    >
                      <option value=""></option>
                      {categories
                        .find((c) => c.name === (localFilters.category || ''))?.subcategories?.map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Price</label>
                      <select
                        value={localFilters.priceRange || ''}
                        onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                      >
                        <option value=""></option>
                        <option value="0-25">Under $25</option>
                        <option value="25-50">$25 - $50</option>
                        <option value="50-100">$50 - $100</option>
                        <option value="100-200">$100 - $200</option>
                        <option value="200+">$200+</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Rating</label>
                      <select
                        value={localFilters.rating || ''}
                        onChange={(e) => handleFilterChange('rating', e.target.value)}
                        className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                      >
                        <option value=""></option>
                        <option value="4.5">4.5+ Stars</option>
                        <option value="4">4+ Stars</option>
                        <option value="3">3+ Stars</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="block text-xs font-semibold text-gray-600">Shipping</span>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={localFilters.freeShipping || false}
                        onChange={(e) => handleFilterChange('freeShipping', e.target.checked)}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      Free Shipping
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={localFilters.express || false}
                        onChange={(e) => handleFilterChange('express', e.target.checked)}
                        className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                      />
                      Express
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Brand</label>
                    <input
                      type="text"
                      placeholder="e.g. FitTech"
                      value={localFilters.brand || ''}
                      onChange={(e) => handleFilterChange('brand', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Sort by</label>
                    <select
                      value={localFilters.sortBy || ''}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    >
                      <option value=""></option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="rating">Customer Rating</option>
                      <option value="newest">Newest</option>
                      <option value="bestselling">Best Selling</option>
                    </select>
                  </div>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600"
                    >
                      <X className="w-4 h-4" />
                      Clear filters
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="hidden md:flex md:items-end md:gap-3 md:flex-wrap mb-0 pb-0 !mb-0">
              <div className="flex-shrink-0">
                <label className="block text-[9px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Price</label>
                <select
                  value={localFilters.priceRange || ''}
                  onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                  className="w-24 rounded-md border border-gray-200 bg-white px-1.5 py-1 text-[11px] focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20"
                >
                  <option value=""></option>
                  <option value="0-25">Under $25</option>
                  <option value="25-50">$25 - $50</option>
                  <option value="50-100">$50 - $100</option>
                  <option value="100-200">$100 - $200</option>
                  <option value="200+">$200+</option>
                </select>
              </div>

              <div className="flex-shrink-0">
                <label className="block text-[9px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Rating</label>
                <select
                  value={localFilters.rating || ''}
                  onChange={(e) => handleFilterChange('rating', e.target.value)}
                  className="w-24 rounded-md border border-gray-200 bg-white px-1.5 py-1 text-[11px] focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20"
                >
                  <option value=""></option>
                  <option value="4.5">4.5+ Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                </select>
              </div>

              <div className="flex-shrink-0">
                <span className="block text-[9px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Shipping</span>
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1 text-[11px] text-gray-700">
                    <input
                      type="checkbox"
                      checked={localFilters.freeShipping || false}
                      onChange={(e) => handleFilterChange('freeShipping', e.target.checked)}
                      className="w-2.5 h-2.5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    Free Shipping
                  </label>
                  <label className="inline-flex items-center gap-1 text-[11px] text-gray-700">
                    <input
                      type="checkbox"
                      checked={localFilters.express || false}
                      onChange={(e) => handleFilterChange('express', e.target.checked)}
                      className="w-2.5 h-2.5 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    Express
                  </label>
                </div>
              </div>

              <div className="flex-shrink-0">
                <label className="block text-[9px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Brand</label>
                <input
                  type="text"
                  placeholder="e.g. FitTech"
                  value={localFilters.brand || ''}
                  onChange={(e) => handleFilterChange('brand', e.target.value)}
                  className="w-32 rounded-md border border-gray-200 bg-white px-1.5 py-1 text-[11px] focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20"
                />
              </div>

              <div className="flex-shrink-0 flex items-end gap-1.5">
                <div>
                  <label className="block text-[9px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Sort by</label>
                  <select
                    value={localFilters.sortBy || ''}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="w-32 rounded-md border border-gray-200 bg-white px-1.5 py-1 text-[11px] focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20"
                  >
                    <option value=""></option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Customer Rating</option>
                    <option value="newest">Newest</option>
                    <option value="bestselling">Best Selling</option>
                  </select>
                </div>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="inline-flex items-center gap-0.5 rounded-md border border-gray-300 px-1.5 py-1 text-[11px] text-gray-600 hover:bg-gray-50"
                  >
                    <X className="w-2.5 h-2.5" />
                    Clear
                  </button>
                )}
              </div>
            </div>

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
                // Limit to 16 items (2 rows of 8) for desktop display
                const displaySubcategories = subcategories.slice(0, 16);
                
                return (
                  <div className="border-t border-gray-200 -mx-3 sm:-mx-4 md:-mx-6 -mb-3 sm:-mb-4 rounded-b-2xl overflow-hidden mt-0">
                    <div className="bg-gradient-to-b from-amber-50 to-white px-3 sm:px-4 md:px-6 py-6 md:py-8">
                      <div className="hidden md:grid md:grid-cols-8 gap-4 lg:gap-6">
                        {displaySubcategories.map((subcategory) => {
                          const icon = subcategoryIcons[subcategory] || '📦';
                          // Get a product image from this subcategory if available
                          const subcategoryProduct = products.find(p => p.subcategory === subcategory);
                          const productImage = subcategoryProduct?.images?.[0];
                          const isSelected = localFilters.subcategory === subcategory;
                          
                          return (
                            <button
                              key={subcategory}
                              type="button"
                              onClick={() => handleFilterChange('subcategory', isSelected ? '' : subcategory)}
                              className="flex flex-col items-center gap-2.5 p-2 hover:opacity-80 transition-opacity relative"
                            >
                              {/* Circular icon container */}
                              <div className={`w-20 h-20 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center overflow-hidden hover:shadow-md transition-shadow ${
                                isSelected ? 'ring-2 ring-orange-500 border-orange-500' : ''
                              }`}>
                                {productImage ? (
                                  <img 
                                    src={productImage} 
                                    alt={subcategory}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                      const fallback = e.target.nextElementSibling;
                                      if (fallback) fallback.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <div 
                                  className={`w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-gray-50 to-gray-100 ${
                                    productImage ? 'hidden' : 'flex'
                                  }`}
                                >
                                  {icon}
                                </div>
                              </div>
                              {/* Text label below */}
                              <span className={`text-xs text-gray-800 text-center leading-tight font-medium max-w-[80px] ${
                                isSelected ? 'text-orange-600 font-semibold' : ''
                              }`}>
                                {subcategory.length > 15 ? `${subcategory.substring(0, 15)}...` : subcategory}
                              </span>
                              {/* Remove button when selected */}
                              {isSelected && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFilterChange('subcategory', '');
                                  }}
                                  className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors shadow-lg z-10"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      {/* Mobile version - keep original layout */}
                      <div className="md:hidden flex flex-wrap gap-4">
                        {subcategories.map((subcategory) => {
                          const icon = subcategoryIcons[subcategory] || '📦';
                          const subcategoryProduct = products.find(p => p.subcategory === subcategory);
                          const productImage = subcategoryProduct?.images?.[0];
                          const isSelected = localFilters.subcategory === subcategory;
                          
                          return (
                            <button
                              key={subcategory}
                              type="button"
                              onClick={() => handleFilterChange('subcategory', isSelected ? '' : subcategory)}
                              className="flex flex-col items-center gap-2 relative"
                            >
                              <div className={`w-16 h-16 rounded-full bg-white border-2 overflow-hidden ${
                                isSelected ? 'border-orange-500' : 'border-gray-200'
                              }`}>
                                {productImage ? (
                                  <img src={productImage} alt={subcategory} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-2xl">
                                    {icon}
                                  </div>
                                )}
                              </div>
                              <span className={`text-xs text-center ${isSelected ? 'text-orange-600 font-semibold' : 'text-gray-700'}`}>
                                {subcategory}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {hasActiveFilters && (
              <div className="pt-2 border-t border-gray-100">
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeFilterEntries.map(([key, value]) => {
                    // Skip category and subcategory as they're shown separately
                    if (key === 'category' || key === 'subcategory') return null;
                    
                    let displayValue = value;
                    if (key === 'priceRange') {
                      displayValue = value === '200+' ? '$200+' : `$${value}`;
                    } else if (key === 'rating') {
                      displayValue = `${value}+ Stars`;
                    } else if (key === 'freeShipping') {
                      displayValue = 'Free Shipping';
                    } else if (key === 'express') {
                      displayValue = 'Express Shipping';
                    } else if (key === 'sortBy') {
                      const sortLabels = {
                        'price-low': 'Price: Low to High',
                        'price-high': 'Price: High to Low',
                        rating: 'Customer Rating',
                        newest: 'Newest',
                        bestselling: 'Best Selling'
                      };
                      displayValue = sortLabels[value] || value;
                    }

                    return (
                      <span
                        key={key}
                        className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-800"
                      >
                        <span>{displayValue}</span>
                        <button
                          type="button"
                          onClick={() => handleFilterChange(key, Array.isArray(value) ? [] : typeof value === 'boolean' ? false : '')}
                          className="hover:text-orange-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
