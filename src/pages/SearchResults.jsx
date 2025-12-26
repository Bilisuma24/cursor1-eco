import React, { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Search as SearchIcon, Filter, ChevronDown, HelpCircle } from "lucide-react";
import ProductCard from "../components/ProductCard";
import ProductGrid from "../components/ProductGrid";
import productsData from "../data/products.js";
import { supabase } from "../lib/supabaseClient";

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || searchParams.get('search') || '';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('best-matches');
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    if (query) {
      fetchSearchResults();
    } else {
      setProducts([]);
      setLoading(false);
    }
  }, [query]);

  const fetchSearchResults = async () => {
    setLoading(true);
    try {
      let dbProducts = null;
      
      try {
        // Fetch products from database that match the search query
        const { data, error: dbError } = await supabase
          .from('product')
          .select('*')
          .or(`name.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%`)
          .order('created_at', { ascending: false });

        if (dbError) {
          console.error('Error fetching search results from database:', dbError);
          dbProducts = null;
        } else {
          dbProducts = data;
        }
      } catch (networkError) {
        console.warn('Network error fetching search results:', networkError);
        dbProducts = null;
      }

      // Helper function to convert image paths to public URLs
      const convertToPublicUrl = (imagePath) => {
        if (!imagePath || typeof imagePath !== 'string') {
          return null;
        }
        
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
          return imagePath;
        }

        // If it's a storage path, construct the public URL
        if (imagePath.includes('product-images')) {
          const { data } = supabase.storage.from('product-images').getPublicUrl(imagePath);
          return data.publicUrl;
        }

        return imagePath;
      };

      // Transform database products
      const transformedDbProducts = (dbProducts || []).map((product) => {
        const images = Array.isArray(product.images) ? product.images : [];
        const convertedImages = images
          .map(img => convertToPublicUrl(img))
          .filter(img => img !== null);

        return {
          id: product.id,
          name: product.name,
          description: product.description || '',
          price: product.price || 0,
          currency: product.currency || 'ETB',
          images: convertedImages.length > 0 ? convertedImages : [`data:image/svg+xml;base64,${btoa(`<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="#f3f4f6"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="18" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>`)}`],
          category: product.category || 'General',
          rating: product.rating || 4.0,
          reviewCount: product.review_count || 0,
          sold: product.sold || 0,
          stock: product.stock || 0,
          originalPrice: product.original_price || null,
          discount: product.discount || null,
          colors: product.colors && Array.isArray(product.colors) && product.colors.length > 0 ? product.colors : null,
          sizes: product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes : null,
          isFromDatabase: true,
        };
      });

      // Filter static products by search query
      const staticProducts = (productsData.products || []).filter(product => {
        const searchLower = query.toLowerCase();
        return (
          product.name.toLowerCase().includes(searchLower) ||
          (product.description && product.description.toLowerCase().includes(searchLower)) ||
          (product.category && product.category.toLowerCase().includes(searchLower))
        );
      });

      // Combine and deduplicate
      const combinedProducts = [...transformedDbProducts, ...staticProducts];
      const uniqueProducts = combinedProducts.reduce((acc, product) => {
        if (!acc.find(p => p.id === product.id)) {
          acc.push(product);
        }
        return acc;
      }, []);

      setProducts(uniqueProducts);
      setOriginalProducts(uniqueProducts); // Store original for sorting
    } catch (error) {
      console.error('Error fetching search results:', error);
      // Fallback to static products filtered by search
      const staticProducts = (productsData.products || []).filter(product => {
        const searchLower = query.toLowerCase();
        return (
          product.name.toLowerCase().includes(searchLower) ||
          (product.description && product.description.toLowerCase().includes(searchLower)) ||
          (product.category && product.category.toLowerCase().includes(searchLower))
        );
      });
      setProducts(staticProducts);
      setOriginalProducts(staticProducts);
    } finally {
      setLoading(false);
    }
  };

  // Store original products for sorting
  const [originalProducts, setOriginalProducts] = useState([]);

  // Sort products
  useEffect(() => {
    if (originalProducts.length > 0) {
      let sorted = [...originalProducts];
      switch (sortBy) {
        case 'best-matches':
          // Keep original order (already sorted by relevance from search)
          sorted = [...originalProducts];
          break;
        case 'top-sales':
          sorted.sort((a, b) => (b.sold || 0) - (a.sold || 0));
          break;
        case 'price-low':
          sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
          break;
        case 'price-high':
          sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
          break;
        default:
          sorted = [...originalProducts];
          break;
      }
      setProducts(sorted);
    }
  }, [sortBy, originalProducts]);

  const handleSortChange = (sort) => {
    setSortBy(sort);
    setShowSortMenu(false);
  };

  // Calculate free shipping threshold (example: ETB 1,738.44)
  const freeShippingThreshold = 1738.44;

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Header with Search Bar */}
        <div className="sticky top-[56px] z-40 bg-white border-b border-gray-200">
          <div className="px-3 py-2.5 flex items-center gap-2">
            <Link to="/" className="p-1 -ml-1">
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </Link>
            <div className="flex-1 flex items-center bg-gray-100 rounded-lg px-3 py-2">
              <span className="text-sm text-gray-700 flex-1 truncate">{query}</span>
              <div className="relative">
                <SearchIcon className="w-4 h-4 text-gray-500" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </div>
            </div>
          </div>
        </div>

        {/* Free Shipping Banner */}
        <div className="bg-green-500 text-white px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-1">
            <span className="text-xs">
              Free shipping over ETB{freeShippingThreshold.toLocaleString()} on all <strong>Choice</strong> items
            </span>
          </div>
          <HelpCircle className="w-4 h-4 shrink-0" />
        </div>

        {/* Sort and Filter Bar */}
        <div className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="flex items-center gap-1 text-xs text-gray-700 whitespace-nowrap"
            >
              Best matches
              <ChevronDown className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleSortChange('top-sales')}
              className="flex items-center gap-1 text-xs text-gray-700 whitespace-nowrap"
            >
              Top sales
              <ChevronDown className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleSortChange('price-low')}
              className="flex items-center gap-1 text-xs text-gray-700 whitespace-nowrap"
            >
              Price
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
          <button className="flex items-center gap-1.5 text-xs text-gray-700 ml-3">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>

        {/* Sort Dropdown Menu */}
        {showSortMenu && (
          <div className="bg-white border-b border-gray-200 px-4 py-2">
            <button
              onClick={() => handleSortChange('best-matches')}
              className={`w-full text-left py-2 text-xs ${sortBy === 'best-matches' ? 'text-[#3b82f6] font-semibold' : 'text-gray-700'}`}
            >
              Best matches
            </button>
            <button
              onClick={() => handleSortChange('top-sales')}
              className={`w-full text-left py-2 text-xs ${sortBy === 'top-sales' ? 'text-[#3b82f6] font-semibold' : 'text-gray-700'}`}
            >
              Top sales
            </button>
            <button
              onClick={() => handleSortChange('price-low')}
              className={`w-full text-left py-2 text-xs ${sortBy === 'price-low' ? 'text-[#3b82f6] font-semibold' : 'text-gray-700'}`}
            >
              Price: Low to High
            </button>
            <button
              onClick={() => handleSortChange('price-high')}
              className={`w-full text-left py-2 text-xs ${sortBy === 'price-high' ? 'text-[#3b82f6] font-semibold' : 'text-gray-700'}`}
            >
              Price: High to Low
            </button>
          </div>
        )}

        {/* Products Grid */}
        <div className="p-2">
          {loading ? (
            <div className="grid grid-cols-2 gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-200 animate-pulse rounded aspect-square" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <ProductGrid products={products} />
          ) : (
            <div className="p-8 text-center">
              <SearchIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2 font-medium">No products found</p>
              <p className="text-sm text-gray-400 mb-4">
                We couldn't find any products matching "{query}"
              </p>
              <Link to="/shop" className="text-[#3b82f6] font-medium">
                Browse all products
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-3">
            <SearchIcon className="w-6 h-6 text-gray-500" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Search Results: "{query}"
              </h1>
              <p className="text-gray-500 mt-1">
                {loading ? 'Searching...' : `${products.length} ${products.length === 1 ? 'product' : 'products'} found`}
              </p>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse rounded aspect-square" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <div className="p-12 text-center">
            <SearchIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2 font-medium">No products found</p>
            <p className="text-gray-400 mb-4">
              We couldn't find any products matching "{query}"
            </p>
            <Link to="/shop" className="text-[#3b82f6] font-medium hover:underline">
              Browse all products
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

