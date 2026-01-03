import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, TrendingUp, Clock, X, ChevronDown, Menu, Camera } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import productsData from '../data/products.js';

const SearchSuggestions = ({ onSearch, placeholder = "Search products..." }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [recentSearches, setRecentSearches] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const suggestionsRef = useRef(null);
  const inputRef = useRef(null);
  // Move trendingSearches to be static or memoized if not changing
  const trendingSearches = [
    'iPhone 15', 'Samsung Galaxy', 'MacBook Pro', 'AirPods', 'Nike Shoes'
  ];

  const discoverMoreItems = useMemo(() => {
    if (recentSearches.length === 0) {
      return [
        'Half Frame Glasses...', 'Chromeheart Glass', 'Blue Light Glasses',
        'Clubmaster Glasse...', 'Browline Glass', 'Chromeheart Glass...',
        'Blue Light Glasses ...', 'Browline Chromeh...', 'Browline Glasses M...'
      ];
    }

    const lastSearch = recentSearches[0].toLowerCase();
    // smartish recommendation: find products in same category as last search or matching name
    const matches = productsData.products.filter(p =>
      (p.category && p.category.toLowerCase().includes(lastSearch)) ||
      (p.name && p.name.toLowerCase().includes(lastSearch))
    );

    // Get categories of matches to suggest broad topics
    const categories = [...new Set(matches.map(p => p.category))];
    const productNames = matches.map(p => p.name);

    let recommendations = [...categories, ...productNames];

    // Dedupe and limit
    recommendations = [...new Set(recommendations)].slice(0, 9);

    // Fill with defaults if not enough
    if (recommendations.length < 5) {
      const defaults = ['Wireless Headphones', 'Smart Watches', 'Running Shoes', 'Leather Bags', 'Sunglasses', 'Laptops'];
      const combined = [...recommendations, ...defaults];
      recommendations = [...new Set(combined)].slice(0, 9);
    }

    return recommendations;
  }, [recentSearches]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (query.length > 0) {
      const lowerQ = query.toLowerCase();
      const results = productsData.products.filter(product =>
        product.name.toLowerCase().includes(lowerQ) ||
        product.category.toLowerCase().includes(lowerQ)
      ).slice(0, 8);
      setSuggestions(results);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const handleSearch = (searchTerm) => {
    if (!searchTerm) return;

    // Add to recent searches
    setRecentSearches(prev => {
      const newSearches = [searchTerm, ...prev.filter(s => s !== searchTerm)].slice(0, 8);
      return newSearches;
    });

    setQuery(searchTerm);
    setShowSuggestions(false);

    if (onSearch) {
      onSearch(searchTerm);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(query);
      inputRef.current?.blur();
    }
  };

  const clearRecent = () => {
    setRecentSearches([]);
  };

  return (
    <div className="relative w-full max-w-[800px] mx-auto z-50" ref={suggestionsRef}>
      <div className="relative flex items-center border-2 border-black rounded-full bg-white overflow-hidden h-10">
        {/* Search Input */}
        <div className="flex-1 relative flex items-center h-full">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Browline Chromehear Glass"
            className="w-full h-full pl-4 pr-12 bg-white text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
          />

          {/* Icons on the right side of input */}
          <div className="absolute right-2 flex items-center gap-2">
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button className="p-1 text-black hover:bg-gray-100 rounded-lg transition-colors">
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Button */}
        <button
          onClick={() => handleSearch(query)}
          className="flex items-center justify-center h-full aspect-square bg-black hover:bg-gray-800 text-white transition-all shrink-0 border-l border-black"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[600px]">
          {/* Top Section: Search History */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">Search history</h3>
              <button onClick={clearRecent} className="text-xs text-blue-500 hover:text-blue-700 font-medium">Clear all</button>
            </div>
            {recentSearches.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(search)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-full text-xs text-gray-700 transition-colors truncate max-w-[150px]"
                  >
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="truncate">{search}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No recent searches</p>
            )}
          </div>

          <div className="flex flex-1 min-h-[350px]">
            {/* Left Sidebar: Discover More */}
            <div className="w-1/3 bg-gray-50/50 border-r border-gray-100 p-2">
              <div className="px-3 py-2 mb-1">
                <h3 className="text-sm font-bold text-gray-900">Discover more</h3>
              </div>
              <div className="space-y-0.5 max-h-[500px] overflow-y-auto">
                {discoverMoreItems.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => handleSearch(item)}
                    className="w-full text-left px-3 py-2 text-[13px] text-gray-600 hover:bg-gray-100 rounded-lg transition-colors truncate text-ellipsis overflow-hidden whitespace-nowrap"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Content: Categories/Results */}
            <div className="w-2/3 p-4 bg-white">
              {query.length > 1 ? (
                /* Live Search Results */
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-3 px-1 uppercase">Matches for "{query}"</div>
                  {suggestions.length > 0 ? (
                    <div className="space-y-2">
                      {suggestions.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => handleSearch(product.name)}
                          className="w-full text-left p-2 hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-3 group border border-transparent hover:border-gray-100"
                        >
                          <img
                            src={product.images?.[0] || product.image || "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2RiZGJkYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmF5LWJhc2VsaW5lPSJtaWRkbGUiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=="}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2RiZGJkYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmF5LWJhc2VsaW5lPSJtaWRkbGUiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==";
                            }}
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600">{product.name}</div>
                            <div className="text-xs text-gray-500">{product.category}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 text-center py-8">No results found</div>
                  )}
                </div>
              ) : (
                /* Default Discover View (Mocked from Image) */
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-gray-900">Apparel Accessories</h3>
                    <button className="text-xs text-blue-500 hover:text-blue-700">Other recommendations</button>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { name: "Women's Sunglasses", img: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=150&h=150&fit=crop" },
                      { name: "Headband", img: "https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?w=150&h=150&fit=crop" },
                      { name: "Gloves", img: "https://images.unsplash.com/photo-1542280756-74b2f55e73ab?w=150&h=150&fit=crop" },
                      { name: "Bandanas", img: "https://images.unsplash.com/photo-1621255531476-88d40786cf8c?w=150&h=150&fit=crop" },
                      { name: "Men's Sunglasses", img: "https://images.unsplash.com/photo-1478145046317-39f10e56b5e9?w=150&h=150&fit=crop" },
                      { name: "Scarf", img: "https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=150&h=150&fit=crop" },
                      { name: "Reading Glasses", img: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?w=150&h=150&fit=crop" },
                      { name: "Women's Belt", img: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=150&h=150&fit=crop" }, // Using bag img as proxy for leather item
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSearch(item.name)}
                        className="flex flex-col items-center gap-2 group text-center"
                      >
                        <div className="w-full aspect-square bg-gray-50 rounded-lg overflow-hidden relative">
                          <img
                            src={item.img}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2RiZGJkYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmF5LWJhc2VsaW5lPSJtaWRkbGUiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==";
                            }}
                          />
                        </div>
                        <span className="text-[11px] leading-tight text-gray-600 group-hover:text-blue-600 line-clamp-2 font-medium">
                          {item.name}
                        </span>
                      </button>
                    ))}

                    {/* More random items to fill */}
                    <button className="flex flex-col items-center gap-2 group text-center">
                      <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400 group-hover:bg-gray-200 transition-colors">
                        +12
                      </div>
                      <span className="text-[11px] text-gray-600">More</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchSuggestions;







