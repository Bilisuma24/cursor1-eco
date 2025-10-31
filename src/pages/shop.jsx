import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Grid, List, Filter, SortAsc, Loader } from "lucide-react";
import ProductCard from "../components/ProductCard";
import SearchAndFilter from "../components/SearchAndFilter";
import productsData from "../data/products.js";
import { supabase } from "../lib/supabaseClient";

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('');
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // Fetch products from Supabase (includes seller-added products)
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Fetch products from database (seller-added products)
      console.log('Fetching products from database...');
      const { data: dbProducts, error: dbError } = await supabase
        .from('product')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) {
        console.error('❌ Error fetching products from database:', dbError);
        console.error('Error code:', dbError.code);
        console.error('Error message:', dbError.message);
        console.error('Error details:', JSON.stringify(dbError, null, 2));
        
        // Check if it's a permissions/RLS issue
        if (dbError.code === '42501' || dbError.message?.includes('permission') || dbError.message?.includes('policy')) {
          console.warn('⚠️ Possible RLS policy issue. Products might not be publicly viewable.');
        }
        
        // Still continue with static products
      } else {
        console.log(`✅ Successfully fetched ${dbProducts?.length || 0} products from database`);
        if (dbProducts && dbProducts.length > 0) {
          console.log('Sample product:', {
            id: dbProducts[0].id,
            name: dbProducts[0].name,
            price: dbProducts[0].price,
            category: dbProducts[0].category,
            seller_id: dbProducts[0].seller_id,
            image_url: dbProducts[0].image_url
          });
        }
      }

      // Transform database products to match ProductCard format
      const transformedDbProducts = (dbProducts || []).map(product => {
        console.log('Transforming product:', product.id, product.name);
        return {
        id: product.id,
        name: product.name || 'Untitled Product',
        description: product.description || '',
        price: parseFloat(product.price) || 0,
        images: (() => {
          // Handle different image formats
          if (product.images && Array.isArray(product.images) && product.images.length > 0) {
            return product.images;
          }
          if (product.image_url) {
            if (Array.isArray(product.image_url)) {
              return product.image_url;
            }
            if (typeof product.image_url === 'string' && product.image_url.trim()) {
              return [product.image_url];
            }
          }
          // Default placeholder
          return ['https://via.placeholder.com/400?text=No+Image'];
        })(),
        category: product.category || 'General',
        rating: product.rating || 4.0,
        reviewCount: product.review_count || 0,
        sold: product.sold || 0,
        stock: product.stock || 0,
        brand: product.brand || '',
        subcategory: product.subcategory || '',
        seller: {
          name: 'Seller',
          verified: product.seller_id ? true : false,
        },
        shipping: {
          free: product.free_shipping || false,
          express: product.express_shipping || false,
        },
        features: product.features || [],
        originalPrice: product.original_price || null,
        discount: product.discount || null,
        isFromDatabase: true, // Flag to identify database products
      };
      });

      console.log(`Transformed ${transformedDbProducts.length} database products`);

      // Combine database products with static products
      // Database products will take precedence (avoid duplicates by ID)
      const staticProducts = productsData.products || [];
      console.log(`Using ${staticProducts.length} static products`);
      const combinedProducts = [...transformedDbProducts, ...staticProducts];
      
      // Remove duplicates based on ID (database products first)
      const uniqueProducts = combinedProducts.reduce((acc, product) => {
        if (!acc.find(p => p.id === product.id)) {
          acc.push(product);
        }
        return acc;
      }, []);

      console.log(`Total unique products: ${uniqueProducts.length}`);
      console.log(`Database products: ${transformedDbProducts.length}, Static products: ${staticProducts.length}`);

      setProducts(uniqueProducts);
      setFilteredProducts(uniqueProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      // Fallback to static products on error
      setProducts(productsData.products);
      setFilteredProducts(productsData.products);
    } finally {
      setLoading(false);
    }
  };

  // Initialize from query string
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('search') || '';
    const cat = params.get('category') || '';
    setSearchTerm(q);
    if (cat) {
      setFilters((prev) => ({ ...prev, category: cat }));
    }
  }, [location.search]);

  useEffect(() => {
    let filtered = [...products];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(product => product.category === filters.category);
    }

    // Apply subcategory filter
    if (filters.subcategory) {
      filtered = filtered.filter(product => product.subcategory === filters.subcategory);
    }

    // Apply brand filter
    if (filters.brand) {
      filtered = filtered.filter(product => product.brand === filters.brand);
    }

    // Apply price range filter
    if (filters.priceRange) {
      const [min, max] = filters.priceRange.split('-').map(Number);
      filtered = filtered.filter(product => {
        if (max) {
          return product.price >= min && product.price <= max;
        } else {
          return product.price >= min;
        }
      });
    }

    // Apply rating filter
    if (filters.rating) {
      const minRating = parseFloat(filters.rating);
      filtered = filtered.filter(product => product.rating >= minRating);
    }

    // Apply free shipping filter
    if (filters.freeShipping) {
      filtered = filtered.filter(product => product.shipping?.free);
    }

    // Apply express shipping filter
    if (filters.express) {
      filtered = filtered.filter(product => product.shipping?.express);
    }

    // Apply sorting
    if (sortBy) {
      switch (sortBy) {
        case 'price-low':
          filtered.sort((a, b) => a.price - b.price);
          break;
        case 'price-high':
          filtered.sort((a, b) => b.price - a.price);
          break;
        case 'rating':
          filtered.sort((a, b) => b.rating - a.rating);
          break;
        case 'newest':
          // Assuming newer products have higher IDs
          filtered.sort((a, b) => b.id - a.id);
          break;
        case 'bestselling':
          filtered.sort((a, b) => b.sold - a.sold);
          break;
        default:
          break;
      }
    }

    setFilteredProducts(filtered);
  }, [products, filters, searchTerm, sortBy]);

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Search and Filter Bar */}
      <SearchAndFilter
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        categories={productsData.categories}
        filters={filters}
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {searchTerm ? `Search results for "${searchTerm}"` : 'All Products'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
            </p>
                </div>

          <div className="flex items-center space-x-4">
            {/* Sort Dropdown */}
                  <div className="flex items-center space-x-2">
              <SortAsc className="w-4 h-4 text-gray-500" />
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sort by</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Customer Rating</option>
                <option value="bestselling">Best Selling</option>
                <option value="newest">Newest</option>
              </select>
                  </div>
                  
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-1 border border-gray-300 rounded-md">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <List className="w-4 h-4" />
              </button>
                    </div>
                  </div>
                </div>

        {/* Products Grid/List */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Filter className="w-16 h-16 mx-auto" />
                </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No products found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Try adjusting your search or filter criteria</p>
                <button
              onClick={() => {
                setSearchTerm('');
                setFilters({});
                setSortBy('');
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear all filters
                </button>
              </div>
        ) : (
          <div className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
          }>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                viewMode={viewMode}
              />
          ))}
        </div>
        )}

        {/* Load More Button */}
        {filteredProducts.length > 0 && (
          <div className="text-center mt-12">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium">
              Load More Products
            </button>
          </div>
        )}
      </div>
    </div>
  );
}