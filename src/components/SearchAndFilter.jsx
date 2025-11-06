import React, { useState } from "react";
import { Search, Filter, X, ChevronDown } from "lucide-react";

export default function SearchAndFilter({ 
  onSearch, 
  onFilterChange, 
  categories = [], 
  filters = {} 
}) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [localFilters, setLocalFilters] = useState(filters);

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

  const hasActiveFilters = Object.values(localFilters).some(value => 
    value && value !== '' && (Array.isArray(value) ? value.length > 0 : true)
  );

  return (
    <div className="bg-white border-b border-gray-200 sticky top-16 z-40 shadow-sm">
      {/* RESPONSIVE FIX: Improved padding for mobile */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 md:py-5">
        {/* Search Bar - RESPONSIVE: Stack on mobile */}
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:space-x-4 mb-3 sm:mb-4 md:mb-5">
          <div className="flex-1 relative">
            <Search className="absolute left-2 sm:left-3 md:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search for products, brands, and more..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full min-h-[44px] md:min-h-[48px] pl-8 sm:pl-10 md:pl-12 pr-4 py-2.5 sm:py-3 md:py-3.5 border border-gray-300 rounded-lg text-sm sm:text-base focus:ring-2 focus:ring-orange-500 focus:border-transparent shadow-sm"
            />
          </div>
          <button
            type="submit"
            className="min-h-[44px] md:min-h-[48px] bg-orange-500 text-white px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3.5 rounded-lg hover:bg-orange-600 transition-colors duration-200 font-medium text-sm sm:text-base whitespace-nowrap touch-manipulation shadow-sm hover:shadow-md"
          >
            Search
          </button>
        </form>

        {/* Filter Bar - RESPONSIVE: Collapse filters on mobile with toggle */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="lg:hidden flex items-center justify-between w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 touch-manipulation"
          >
            <span className="flex items-center space-x-2">
              <Filter className="w-4 h-4" />
              <span>Filters {hasActiveFilters && `(${Object.values(localFilters).filter(v => v && v !== '' && (Array.isArray(v) ? v.length > 0 : true)).length})`}</span>
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Filter Controls - RESPONSIVE: Hide on mobile unless open, show on desktop */}
          <div className={`${isFilterOpen ? 'flex' : 'hidden'} lg:flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4`}>
            {/* Categories */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
              <span className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">Category:</span>
              <select
                value={localFilters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="flex-1 sm:flex-none min-w-[120px] border border-gray-300 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            {/* Subcategory (dependent) - RESPONSIVE: Hide on small mobile */}
            <div className="hidden md:flex items-center space-x-1.5 sm:space-x-2">
              <span className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">Subcategory:</span>
              <select
                value={localFilters.subcategory || ''}
                onChange={(e) => handleFilterChange('subcategory', e.target.value)}
                className="min-w-[120px] border border-gray-300 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All</option>
                {categories
                  .find(c => c.name === (localFilters.category || ''))?.subcategories?.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
              </select>
            </div>

            {/* Price Range - RESPONSIVE: Full width on mobile */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0 flex-1 sm:flex-none">
              <span className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">Price:</span>
              <select
                value={localFilters.priceRange || ''}
                onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                className="flex-1 sm:flex-none min-w-[120px] border border-gray-300 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Any Price</option>
                <option value="0-25">Under $25</option>
                <option value="25-50">$25 - $50</option>
                <option value="50-100">$50 - $100</option>
                <option value="100-200">$100 - $200</option>
                <option value="200+">$200+</option>
              </select>
            </div>

            {/* Rating - RESPONSIVE: Full width on mobile */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 min-w-0 flex-1 sm:flex-none">
              <span className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">Rating:</span>
              <select
                value={localFilters.rating || ''}
                onChange={(e) => handleFilterChange('rating', e.target.value)}
                className="flex-1 sm:flex-none min-w-[120px] border border-gray-300 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Any Rating</option>
                <option value="4.5">4.5+ Stars</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
              </select>
            </div>
            {/* Shipping - RESPONSIVE: Stack checkboxes on mobile */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-x-2 gap-y-1">
              <label className="flex items-center space-x-1.5 text-xs sm:text-sm">
                <input
                  type="checkbox"
                  checked={localFilters.freeShipping || false}
                  onChange={(e) => handleFilterChange('freeShipping', e.target.checked)}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 w-4 h-4"
                />
                <span className="text-gray-700 whitespace-nowrap">Free Shipping</span>
              </label>
              <label className="flex items-center space-x-1.5 text-xs sm:text-sm">
                <input
                  type="checkbox"
                  checked={localFilters.express || false}
                  onChange={(e) => handleFilterChange('express', e.target.checked)}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 w-4 h-4"
                />
                <span className="text-gray-700 whitespace-nowrap">Express</span>
              </label>
            </div>
            {/* Brand - RESPONSIVE: Hide on mobile and tablet */}
            <div className="hidden lg:flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Brand:</span>
              <input
                type="text"
                placeholder="e.g. FitTech"
                value={localFilters.brand || ''}
                onChange={(e) => handleFilterChange('brand', e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent min-w-[120px]"
              />
            </div>
          </div>

          {/* Sort and Clear - RESPONSIVE: Stack on mobile */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 lg:space-x-2">
            {/* Sort */}
            <div className="flex items-center space-x-2 min-w-0 flex-1 sm:flex-none">
              <span className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap hidden sm:inline">Sort by:</span>
              <select
                value={localFilters.sortBy || ''}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="flex-1 sm:flex-none min-w-[140px] border border-gray-300 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Customer Rating</option>
                <option value="newest">Newest</option>
                <option value="bestselling">Best Selling</option>
              </select>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center justify-center space-x-1 text-xs sm:text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200 px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Filter Panel */}
        {isFilterOpen && (
          <div className="lg:hidden bg-gray-50 rounded-lg p-4 space-y-4">
            {/* Categories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={localFilters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subcategory */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
              <select
                value={localFilters.subcategory || ''}
                onChange={(e) => handleFilterChange('subcategory', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All</option>
                {categories
                  .find(c => c.name === (localFilters.category || ''))?.subcategories?.map((sub) => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
              <select
                value={localFilters.priceRange || ''}
                onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Any Price</option>
                <option value="0-25">Under $25</option>
                <option value="25-50">$25 - $50</option>
                <option value="50-100">$50 - $100</option>
                <option value="100-200">$100 - $200</option>
                <option value="200+">$200+</option>
              </select>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
              <select
                value={localFilters.rating || ''}
                onChange={(e) => handleFilterChange('rating', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Any Rating</option>
                <option value="4.5">4.5+ Stars</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
              </select>
            </div>

            {/* Shipping Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Shipping</label>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={localFilters.freeShipping || false}
                    onChange={(e) => handleFilterChange('freeShipping', e.target.checked)}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">Free Shipping</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={localFilters.express || false}
                    onChange={(e) => handleFilterChange('express', e.target.checked)}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700">Express</span>
                </label>
              </div>
            </div>

            {/* Brand */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
              <input
                type="text"
                placeholder="e.g. FitTech"
                value={localFilters.brand || ''}
                onChange={(e) => handleFilterChange('brand', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort by</label>
              <select
                value={localFilters.sortBy || ''}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Customer Rating</option>
                <option value="newest">Newest</option>
                <option value="bestselling">Best Selling</option>
              </select>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(localFilters).map(([key, value]) => {
              if (!value || value === '' || (Array.isArray(value) && value.length === 0)) return null;
              
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
                  'rating': 'Customer Rating',
                  'newest': 'Newest',
                  'bestselling': 'Best Selling'
                };
                displayValue = sortLabels[value] || value;
              }

              return (
                <span
                  key={key}
                  className="inline-flex items-center space-x-1 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm"
                >
                  <span>{displayValue}</span>
                  <button
                    onClick={() => handleFilterChange(key, '')}
                    className="hover:text-orange-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
