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
    <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex items-center space-x-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for products, brands, and more..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
          >
            Search
          </button>
        </form>

        {/* Filter Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Categories */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Category:</span>
              <select
                value={localFilters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Price:</span>
              <select
                value={localFilters.priceRange || ''}
                onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Rating:</span>
              <select
                value={localFilters.rating || ''}
                onChange={(e) => handleFilterChange('rating', e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Any Rating</option>
                <option value="4.5">4.5+ Stars</option>
                <option value="4">4+ Stars</option>
                <option value="3">3+ Stars</option>
              </select>
            </div>

            {/* Shipping */}
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={localFilters.freeShipping || false}
                  onChange={(e) => handleFilterChange('freeShipping', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Free Shipping</span>
              </label>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Sort */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <select
                value={localFilters.sortBy || ''}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                <X className="w-4 h-4" />
                <span>Clear Filters</span>
              </button>
            )}
          </div>
        </div>

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
                  className="inline-flex items-center space-x-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                >
                  <span>{displayValue}</span>
                  <button
                    onClick={() => handleFilterChange(key, '')}
                    className="hover:text-blue-600"
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
