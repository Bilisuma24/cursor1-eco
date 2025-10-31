import React, { useState, useEffect, useRef } from 'react';
import { Search, TrendingUp, Clock, X } from 'lucide-react';
import productsData from '../data/products.js';

const SearchSuggestions = ({ onSearch, placeholder = "Search products..." }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [trendingSearches] = useState([
    'iPhone 15', 'Samsung Galaxy', 'MacBook Pro', 'AirPods', 'Nike Shoes'
  ]);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (query.length > 1) {
      const filtered = productsData.products
        .filter(product => 
          product.name.toLowerCase().includes(query.toLowerCase()) ||
          product.category.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (searchQuery) => {
    if (searchQuery.trim()) {
      // Add to recent searches
      const newRecent = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
      setRecentSearches(newRecent);
      localStorage.setItem('recentSearches', JSON.stringify(newRecent));
      
      onSearch(searchQuery);
      setShowSuggestions(false);
      setQuery('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  return (
    <div className="relative w-full max-w-md" ref={suggestionsRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-y-auto">
          {suggestions.length > 0 ? (
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-3 py-2 uppercase tracking-wide">
                Products
              </div>
              {suggestions.map((product, index) => (
                <button
                  key={product.id}
                  onClick={() => handleSearch(product.name)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center space-x-3 group"
                >
                  <img 
                    src={product.images?.[0]} 
                    alt={product.name}
                    className="w-8 h-8 object-cover rounded-md"
                    onError={(e) => e.target.src = 'https://via.placeholder.com/32?text=?'}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {product.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {product.category}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4">
              {recentSearches.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Recent Searches
                      </span>
                    </div>
                    <button
                      onClick={clearRecent}
                      className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearch(search)}
                        className="w-full text-left px-2 py-1 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    Trending
                  </span>
                </div>
                <div className="space-y-1">
                  {trendingSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(search)}
                      className="w-full text-left px-2 py-1 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchSuggestions;




