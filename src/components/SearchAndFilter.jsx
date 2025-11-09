import React, { useEffect, useState } from "react";
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
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
          <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder="Search for products, brands, and more..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-12 md:h-[52px] pl-9 sm:pl-11 pr-4 md:pr-5 rounded-xl border border-gray-200 bg-white text-sm sm:text-base focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 shadow-inner"
                />
              </div>
              <button
                type="submit"
                className="h-12 md:h-[52px] px-6 md:px-8 rounded-xl bg-orange-500 text-white text-sm sm:text-base font-semibold shadow-sm hover:bg-orange-600 transition-colors"
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

            <div className="hidden md:grid md:grid-cols-12 md:gap-4 md:items-end">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Price</label>
                <select
                  value={localFilters.priceRange || ''}
                  onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value=""></option>
                  <option value="0-25">Under $25</option>
                  <option value="25-50">$25 - $50</option>
                  <option value="50-100">$50 - $100</option>
                  <option value="100-200">$100 - $200</option>
                  <option value="200+">$200+</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Rating</label>
                <select
                  value={localFilters.rating || ''}
                  onChange={(e) => handleFilterChange('rating', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value=""></option>
                  <option value="4.5">4.5+ Stars</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                </select>
              </div>

              <div className="col-span-3">
                <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Shipping</span>
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={localFilters.freeShipping || false}
                      onChange={(e) => handleFilterChange('freeShipping', e.target.checked)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    Free Shipping
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={localFilters.express || false}
                      onChange={(e) => handleFilterChange('express', e.target.checked)}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    Express
                  </label>
                </div>
              </div>

              <div className="col-span-3">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Brand</label>
                <input
                  type="text"
                  placeholder="e.g. FitTech"
                  value={localFilters.brand || ''}
                  onChange={(e) => handleFilterChange('brand', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div className="col-span-2 flex items-end justify-end gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Sort by</label>
                  <select
                    value={localFilters.sortBy || ''}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
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
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                  >
                    <X className="w-4 h-4" />
                    Clear
                  </button>
                )}
              </div>
            </div>

            {hasActiveFilters && (
              <div className="pt-2 border-t border-gray-100">
                <div className="mt-3 flex flex-wrap gap-2">
                  {activeFilterEntries.map(([key, value]) => {
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
