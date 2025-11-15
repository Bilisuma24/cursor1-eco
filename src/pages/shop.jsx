import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Grid, List, Filter, SortAsc, Loader, Search, ShoppingCart, User } from "lucide-react";
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
  const [selectedCategory, setSelectedCategory] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch products from Supabase (includes seller-added products)
  useEffect(() => {
    fetchProducts();
  }, []);

  // Refresh products when navigating to shop page
  useEffect(() => {
    const handleFocus = () => {
      // Refresh products when page comes into focus (user might have added a product)
      fetchProducts();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Fetch products from database (seller-added products)
      // IMPORTANT: Fetch ALL products without any filters so public shop can see everything
      console.log('🛒 Fetching products from database for shop...');
      console.log('Current Supabase client URL:', supabase.supabaseUrl);
      
      const { data: dbProducts, error: dbError } = await supabase
        .from('product')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000); // Limit to prevent too many results
      
      console.log('Query executed. Results:', {
        hasData: !!dbProducts,
        dataLength: dbProducts?.length || 0,
        hasError: !!dbError,
        errorCode: dbError?.code,
        errorMessage: dbError?.message
      });

      if (dbError) {
        console.error('❌❌❌ ERROR FETCHING PRODUCTS ❌❌❌');
        console.error('Error code:', dbError.code);
        console.error('Error message:', dbError.message);
        console.error('Error details:', JSON.stringify(dbError, null, 2));
        
        // Check if it's a permissions/RLS issue
        if (dbError.code === '42501' || dbError.code === 'PGRST301' || 
            dbError.message?.includes('permission') || 
            dbError.message?.includes('policy') ||
            dbError.message?.includes('row-level security')) {
          console.error('🚫🚫🚫 RLS POLICY BLOCKING ACCESS! 🚫🚫🚫');
          console.error('The product table is blocked from public viewing.');
          console.error('SOLUTION: Run the SQL in URGENT-FIX-PRODUCT-VISIBILITY.sql');
          console.error('Or run this SQL in Supabase:');
          console.error(`
CREATE POLICY "public_read_products"
  ON "product"
  FOR SELECT
  TO public
  USING (true);
          `);
          
          // Show alert to user
          alert('⚠️ Products cannot be viewed! RLS policy is blocking access.\n\nPlease run the SQL fix in Supabase Dashboard:\n\nCREATE POLICY "public_read_products"\n  ON "product"\n  FOR SELECT\n  TO public\n  USING (true);');
        }
        
        // Still continue with static products
      } else {
        if (dbProducts && dbProducts.length > 0) {
          console.log(`✅✅✅ SUCCESS! Fetched ${dbProducts.length} products from database ✅✅✅`);
          console.log('Products breakdown:');
          const sellerProducts = dbProducts.filter(p => p.seller_id);
          const adminProducts = dbProducts.filter(p => !p.seller_id);
          console.log(`  - Seller products: ${sellerProducts.length}`);
          console.log(`  - Admin/Other products: ${adminProducts.length}`);
          
          if (sellerProducts.length > 0) {
            console.log('Sample seller product:', {
              id: sellerProducts[0].id,
              name: sellerProducts[0].name,
              price: sellerProducts[0].price,
              seller_id: sellerProducts[0].seller_id
            });
          }
        } else {
          console.warn('⚠️ Query succeeded but returned 0 products.');
          console.warn('This could mean:');
          console.warn('  1. No products in database');
          console.warn('  2. RLS policy is filtering them out');
          console.warn('  3. All products are being blocked');
        }
      }

      // Transform database products to match ProductCard format
      const transformedDbProducts = (dbProducts || []).map(product => {
        console.log('Transforming product:', product.id, product.name);
        console.log('Product images data:', {
          images: product.images,
          image_url: product.image_url,
          imagesType: typeof product.images,
          imagesIsArray: Array.isArray(product.images),
          imagesLength: Array.isArray(product.images) ? product.images.length : 'N/A'
        });
        
        // Helper function to convert image paths to public URLs
        const convertToPublicUrl = (imagePath) => {
          if (!imagePath || typeof imagePath !== 'string') {
            return null;
          }
          
          // If it's already a full URL (http/https), return as-is
          if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
          }
          
          // If it's a relative path, convert to public URL
          // Remove leading slash if present
          const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
          
          try {
            const { data } = supabase.storage
              .from('product-images')
              .getPublicUrl(cleanPath);
            return data?.publicUrl || null;
          } catch (err) {
            console.warn('Error converting image path to URL:', cleanPath, err);
            return null;
          }
        };
        
        return {
        id: product.id,
        name: product.name || 'Untitled Product',
        description: product.description || '',
        price: parseFloat(product.price) || 0,
        images: (() => {
          // Handle different image formats
          let imageArray = [];
          
          // Check product.images array first
          if (product.images) {
            if (Array.isArray(product.images) && product.images.length > 0) {
              imageArray = product.images.filter(img => img != null && img !== '');
            } else if (typeof product.images === 'string' && product.images.trim()) {
              // Handle case where images might be stored as a single string instead of array
              try {
                const parsed = JSON.parse(product.images);
                if (Array.isArray(parsed)) {
                  imageArray = parsed.filter(img => img != null && img !== '');
                } else {
                  imageArray = [product.images];
                }
              } catch {
                imageArray = [product.images];
              }
            }
          }
          
          // Check product.image_url (could be array or string) if images is empty
          if (imageArray.length === 0 && product.image_url) {
            if (Array.isArray(product.image_url)) {
              imageArray = product.image_url.filter(img => img != null && img !== '');
            } else if (typeof product.image_url === 'string' && product.image_url.trim()) {
              imageArray = [product.image_url];
            }
          }
          
          // Convert all image paths to public URLs
          const convertedImages = imageArray
            .map(img => {
              if (typeof img === 'string' && img.trim()) {
                const trimmed = img.trim();
                // Skip ALL via.placeholder.com URLs (they don't work and cause errors)
                if (trimmed.includes('via.placeholder.com')) {
                  return null;
                }
                // If it's already a full URL, return it
                if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image')) {
                  return trimmed;
                }
                // Try to convert relative path to public URL
                const publicUrl = convertToPublicUrl(trimmed);
                // Only return if we got a valid URL back
                if (publicUrl && (publicUrl.startsWith('http://') || publicUrl.startsWith('https://'))) {
                  return publicUrl;
                }
                // If conversion failed, skip it
                return null;
              }
              return null;
            })
            .filter(img => {
              // Only keep valid URLs that start with http/https or data URIs
              if (typeof img === 'string' && img.trim().length > 0) {
                const trimmed = img.trim();
                return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image');
              }
              return false;
            });
          
          // Return converted images or placeholder
          if (convertedImages.length > 0) {
            console.log(`✅ Product ${product.id} has ${convertedImages.length} images:`, convertedImages);
            return convertedImages;
          }
          
          // Default placeholder - use data URI SVG to avoid external service issues
          console.warn(`⚠️ Product ${product.id} has no images, using SVG placeholder`);
          const svgPlaceholder = `data:image/svg+xml;base64,${btoa(`<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
            <rect width="400" height="400" fill="#f3f4f6"/>
            <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="18" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">No Image</text>
          </svg>`)}`;
          return [svgPlaceholder];
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
        colors: product.colors && Array.isArray(product.colors) && product.colors.length > 0 ? product.colors : null,
        sizes: product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes : null,
        gender: product.gender || null,
        isFromDatabase: true, // Flag to identify database products
      };
      });

      console.log(`✅ Transformed ${transformedDbProducts.length} database products`);

      // Combine database products with static products
      // Database products will take precedence (avoid duplicates by ID)
      const staticProducts = productsData.products || [];
      console.log(`📦 Using ${staticProducts.length} static products`);
      
      // Prioritize database products (seller products) over static
      const combinedProducts = [...transformedDbProducts, ...staticProducts];
      
      // Remove duplicates based on ID (database products first)
      const uniqueProducts = combinedProducts.reduce((acc, product) => {
        if (!acc.find(p => p.id === product.id)) {
          acc.push(product);
        }
        return acc;
      }, []);

      const sellerProductCount = transformedDbProducts.length;
      const totalCount = uniqueProducts.length;
      
      console.log(`📊 Product Summary:`);
      console.log(`   - Seller/Database products: ${sellerProductCount}`);
      console.log(`   - Static products: ${staticProducts.length}`);
      console.log(`   - Total unique products: ${totalCount}`);
      
      if (sellerProductCount === 0 && dbProducts && dbProducts.length === 0) {
        console.warn('⚠️ No products found in database. Products may be blocked by RLS policies.');
      } else if (dbError && dbError.code === '42501') {
        console.error('🚫 RLS POLICY ERROR: Products are blocked from public viewing!');
        console.error('   Run the SQL fix in fix-shop-product-visibility.sql');
      }

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
    const subcat = params.get('subcategory') || '';
    setSearchTerm(q);
    setSelectedCategory(cat || 'For you');
    setFilters((prev) => ({
      ...prev,
      category: cat || '',
      subcategory: subcat || ''
    }));
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

  const categories = productsData.categories || [];
  const allCategories = ['For you', 'All', ...categories.map(cat => cat.name)];

  // Mobile category handler
  const handleCategorySelect = (categoryName) => {
    if (categoryName === 'For you') {
      setSelectedCategory('For you');
      setFilters((prev) => ({ ...prev, category: '' }));
      navigate('/shop');
    } else if (categoryName === 'All') {
      setSelectedCategory('All');
      setFilters((prev) => ({ ...prev, category: '' }));
      navigate('/shop');
    } else {
      setSelectedCategory(categoryName);
      setFilters((prev) => ({ ...prev, category: categoryName }));
      navigate(`/shop?category=${encodeURIComponent(categoryName)}`);
    }
  };

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Mobile Category Layout */}
      <div className="md:hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 py-3 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-gray-900">Eco</span>
              <span className="text-xl font-bold text-orange-500">Store</span>
            </Link>
            <button 
              onClick={() => navigate('/shop')}
              className="p-2"
            >
              <Search className="w-6 h-6 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Two-Panel Layout */}
        <div className="flex h-[calc(100vh-140px)] overflow-hidden">
          {/* Left Panel - Categories List */}
          <div className="w-32 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="py-2">
              {allCategories.map((category, index) => (
                <button
                  key={index}
                  onClick={() => handleCategorySelect(category)}
                  className={`w-full text-left px-3 py-2.5 text-xs transition-colors relative ${
                    selectedCategory === category
                      ? 'text-red-500 font-semibold'
                      : 'text-gray-900'
                  }`}
                >
                  <span className="relative">
                    {category}
                    {selectedCategory === category && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500"></span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Panel - Product Grid */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="p-3 pb-20">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Recommended</h2>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">No products found</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    {filteredProducts.map((product) => (
                      <Link
                        key={product.id}
                        to={`/product/${product.id}`}
                        className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:border-orange-500 transition-colors"
                      >
                        <div className="aspect-square bg-gray-50">
                          <img
                            src={product.images?.[0] || product.image_url || 'https://via.placeholder.com/150'}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-2">
                          <p className="text-xs text-gray-900 line-clamp-2 min-h-[32px]">{product.name}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                  {/* Category Button at Bottom */}
                  {selectedCategory && selectedCategory !== 'All' && selectedCategory !== 'For you' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleCategorySelect(selectedCategory)}
                        className="w-full bg-gray-900 text-white py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                      >
                        {selectedCategory}
                      </button>
                    </div>
                  )}
                  {/* For you button */}
                  {selectedCategory === 'For you' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleCategorySelect('For you')}
                        className="w-full bg-gray-900 text-white py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                      >
                        For you
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block bg-gray-50 min-h-screen">
        <SearchAndFilter
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
          categories={productsData.categories}
          filters={filters}
        />

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Results Header - Desktop Optimized */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {searchTerm ? `Search results for "${searchTerm}"` : 'All Products'}
              </h1>
              <p className="text-base text-gray-600">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                {products.some(p => p.isFromDatabase) && (
                  <span className="ml-2 text-sm text-green-600">
                    ({products.filter(p => p.isFromDatabase).length} from sellers)
                  </span>
                )}
              </p>
            </div>

            {/* Sort and View Controls - Desktop */}
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <SortAsc className="w-5 h-5 text-gray-500" />
                <select
                  value={sortBy}
                  onChange={handleSortChange}
                  className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
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
              <div className="flex items-center border border-gray-300 rounded-lg bg-white shadow-sm">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center justify-center p-2.5 rounded-l-lg transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  aria-label="Grid view"
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center justify-center p-2.5 rounded-r-lg transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  aria-label="List view"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => {
                  setLoading(true);
                  fetchProducts();
                }}
                disabled={loading}
                className="px-4 py-2.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                title="Refresh products"
              >
                {loading ? 'Refreshing...' : '🔄 Refresh'}
              </button>
            </div>
          </div>

          {/* Products Grid/List - Desktop Optimized */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 px-4 bg-white rounded-xl shadow-sm">
              <div className="text-gray-400 mb-4">
                <Filter className="w-24 h-24 mx-auto" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">No products found</h3>
              <p className="text-base text-gray-600 mb-8">Try adjusting your search or filter criteria</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilters({});
                  setSortBy('');
                }}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-base transition-colors duration-200 shadow-md"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className={
              viewMode === 'grid'
                ? 'grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
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

          {/* Load More Button - Desktop */}
          {filteredProducts.length > 0 && (
            <div className="text-center mt-12">
              <button className="bg-blue-600 text-white px-10 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-semibold text-base shadow-md hover:shadow-lg">
                Load More Products
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}