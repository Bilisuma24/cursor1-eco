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
  const [networkError, setNetworkError] = useState(false);
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
        
        // Check if it's a network error
        if (dbError.message?.includes('Failed to fetch') || 
            dbError.message?.includes('ERR_INTERNET_DISCONNECTED') ||
            dbError.message?.includes('ERR_NAME_NOT_RESOLVED') ||
            dbError.message?.includes('NetworkError') ||
            dbError.code === 'PGRST116') {
          console.error('🌐🌐🌐 NETWORK ERROR - Cannot fetch seller products! 🌐🌐🌐');
          console.error('Seller products are stored in Supabase but cannot be loaded due to network issues.');
          console.error('The app will show static products only until connection is restored.');
          setNetworkError(true);
        }
        
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
          console.log(`  - Seller products (with seller_id): ${sellerProducts.length}`);
          console.log(`  - Admin/Other products (no seller_id): ${adminProducts.length}`);
          
          if (sellerProducts.length > 0) {
            console.log('✅ Sample seller product:', {
              id: sellerProducts[0].id,
              name: sellerProducts[0].name,
              price: sellerProducts[0].price,
              seller_id: sellerProducts[0].seller_id,
              images: sellerProducts[0].images?.length || 0
            });
            console.log('✅ ALL SELLER PRODUCTS:', sellerProducts.map(p => ({
              id: p.id,
              name: p.name,
              seller_id: p.seller_id,
              price: p.price
            })));
          } else {
            console.error('❌❌❌ CRITICAL: No products with seller_id found! ❌❌❌');
            console.error('This means either:');
            console.error('  1. No seller has posted products yet');
            console.error('  2. Products were created without seller_id');
            console.error('  3. seller_id column might not exist in database');
            console.error('  4. RLS policy is filtering out products with seller_id');
            console.error('All fetched products (first 10):', dbProducts.slice(0, 10).map(p => ({ 
              id: p.id, 
              name: p.name, 
              has_seller_id: !!p.seller_id,
              seller_id: p.seller_id,
              created_at: p.created_at
            })));
            if (dbProducts.length > 10) {
              console.error(`... and ${dbProducts.length - 10} more products`);
            }
          }
        } else {
          console.warn('⚠️ Query succeeded but returned 0 products.');
          console.warn('This could mean:');
          console.warn('  1. No products in database');
          console.warn('  2. RLS policy is filtering them out');
          console.warn('  3. All products are being blocked');
          console.warn('  4. Check Supabase dashboard to verify products exist');
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
        seller_id: product.seller_id || null, // Preserve seller_id to identify seller products
        isSellerProduct: !!product.seller_id, // Explicit flag for seller products
      };
      });

      console.log(`✅ Transformed ${transformedDbProducts.length} database products`);
      
      // Detailed logging for seller products
      const sellerProductsInTransformed = transformedDbProducts.filter(p => p.seller_id || p.isSellerProduct);
      console.log(`🔍 DETAILED SELLER PRODUCT CHECK:`);
      console.log(`   - Total transformed products: ${transformedDbProducts.length}`);
      console.log(`   - Products with seller_id: ${sellerProductsInTransformed.length}`);
      if (sellerProductsInTransformed.length > 0) {
        console.log(`   - Seller product IDs:`, sellerProductsInTransformed.map(p => ({ id: p.id, name: p.name, seller_id: p.seller_id })));
      } else {
        console.warn(`   ⚠️ NO SELLER PRODUCTS FOUND IN TRANSFORMED PRODUCTS!`);
        console.warn(`   - All transformed products:`, transformedDbProducts.map(p => ({ 
          id: p.id, 
          name: p.name, 
          has_seller_id: !!p.seller_id,
          seller_id: p.seller_id,
          isSellerProduct: p.isSellerProduct,
          isFromDatabase: p.isFromDatabase
        })));
      }

      // Combine database products with static products
      // Database products will take precedence (avoid duplicates by ID)
      const staticProducts = productsData.products || [];
      console.log(`📦 Using ${staticProducts.length} static products`);
      
      // Prioritize database products (seller products) over static
      // IMPORTANT: Include ALL database products, even if they have seller_id
      const combinedProducts = [...transformedDbProducts, ...staticProducts];
      
      // Remove duplicates based on ID (database products first)
      // This ensures seller products are included
      const uniqueProducts = combinedProducts.reduce((acc, product) => {
        if (!acc.find(p => p.id === product.id)) {
          acc.push(product);
        }
        return acc;
      }, []);
      
      // CRITICAL: Ensure seller products are NOT filtered out
      // Log all products to verify seller products are included
      const sellerProductsInFinal = uniqueProducts.filter(p => p.seller_id || p.isSellerProduct);
      console.log(`🔍 FINAL PRODUCT LIST CHECK:`);
      console.log(`   - Total products in final list: ${uniqueProducts.length}`);
      console.log(`   - Seller products in final list: ${sellerProductsInFinal.length}`);
      if (sellerProductsInFinal.length > 0) {
        console.log(`✅ Seller products ARE in final list:`, sellerProductsInFinal.map(p => ({ 
          id: p.id, 
          name: p.name, 
          seller_id: p.seller_id 
        })));
      } else {
        console.error(`❌ NO SELLER PRODUCTS IN FINAL LIST!`);
        console.error(`   - All products:`, uniqueProducts.map(p => ({ 
          id: p.id, 
          name: p.name, 
          has_seller_id: !!p.seller_id,
          seller_id: p.seller_id 
        })));
      }

      const sellerProductCount = transformedDbProducts.filter(p => p.seller_id || p.isSellerProduct).length;
      const totalCount = uniqueProducts.length;
      
      console.log(`📊 Product Summary:`);
      console.log(`   - Seller/Database products (total): ${transformedDbProducts.length}`);
      console.log(`   - Seller products (with seller_id): ${sellerProductCount}`);
      console.log(`   - Static products: ${staticProducts.length}`);
      console.log(`   - Total unique products: ${totalCount}`);
      
      // Final check - verify seller products are in the final list
      const finalSellerProducts = uniqueProducts.filter(p => p.seller_id || p.isSellerProduct);
      console.log(`🔍 FINAL CHECK - Seller products in display list: ${finalSellerProducts.length}`);
      if (finalSellerProducts.length > 0) {
        console.log(`✅ Seller products will be displayed:`, finalSellerProducts.map(p => ({ id: p.id, name: p.name })));
      } else {
        console.error(`❌❌❌ NO SELLER PRODUCTS IN FINAL DISPLAY LIST! ❌❌❌`);
        console.error(`This means seller products are being filtered out or not included.`);
      }
      
      if (sellerProductCount === 0 && dbProducts && dbProducts.length === 0) {
        console.warn('⚠️ No products found in database. Products may be blocked by RLS policies.');
      } else if (dbError && dbError.code === '42501') {
        console.error('🚫 RLS POLICY ERROR: Products are blocked from public viewing!');
        console.error('   Run the SQL fix in fix-shop-product-visibility.sql');
      } else if (sellerProductCount === 0 && dbProducts && dbProducts.length > 0) {
        console.error('❌❌❌ CRITICAL: Products fetched but NONE have seller_id! ❌❌❌');
        console.error('This means products in database were created without seller_id.');
        console.error('All fetched products:', dbProducts.map(p => ({ 
          id: p.id, 
          name: p.name, 
          seller_id: p.seller_id,
          has_seller_id: !!p.seller_id 
        })));
      }

      setProducts(uniqueProducts);
      setFilteredProducts(uniqueProducts);
      setNetworkError(false); // Clear network error on success
    } catch (error) {
      console.error('Error fetching products:', error);
      // Check if it's a network error
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('ERR_INTERNET_DISCONNECTED') ||
          error?.name === 'TypeError' ||
          error?.name === 'NetworkError') {
        setNetworkError(true);
        console.error('🌐 Network error: Seller products cannot be loaded');
      }
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
    
    // Only apply filters if they exist in the URL
    // If no category in URL, explicitly show all products (no category filter)
    setSearchTerm(q);
    
    // If there's a category in the URL, use it; otherwise set to 'All' to show all products
    if (cat) {
      setSelectedCategory(cat);
      setFilters((prev) => ({
        ...prev,
        category: cat,
        subcategory: subcat || ''
      }));
    } else {
      // No category in URL - show all products
      setSelectedCategory('All');
      setFilters((prev) => ({
        ...prev,
        category: '', // Empty category means show all
        subcategory: ''
      }));
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

    // Apply seller products filter
    if (filters.sellerOnly) {
      filtered = filtered.filter(product => product.isSellerProduct === true || (product.isFromDatabase && product.seller_id));
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
        {/* Header (fixed on mobile to always stay visible) */}
        <div className="fixed inset-x-0 top-0 z-40 bg-white border-b border-gray-200">
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

        {/* Spacer to offset fixed header height */}
        <div className="h-[56px]" />

        {/* Two-Panel Layout */}
        <div className="flex h-[calc(100vh-140px)] overflow-hidden">
          {/* Left Panel - Categories List */}
          <div className="w-24 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="py-1.5">
              {allCategories.map((category, index) => (
                <button
                  key={index}
                  onClick={() => handleCategorySelect(category)}
                  className={`w-full text-left px-2 py-1.5 text-[11px] leading-tight transition-colors relative ${
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
              {/* Network Error Banner - Mobile */}
              {networkError && (
                <div className="mb-4 p-3 bg-red-50 border-2 border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 text-lg">⚠️</span>
                    <div className="flex-1">
                      <h3 className="text-red-900 font-semibold text-sm mb-1">No Internet Connection</h3>
                      <p className="text-red-800 text-xs mb-2">
                        Seller products require internet. Showing static products only.
                      </p>
                      <button
                        onClick={fetchProducts}
                        className="text-xs text-red-700 hover:text-red-900 underline font-medium"
                      >
                        Retry Connection
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <h2 className="text-sm font-semibold text-gray-900 mb-3">Recommended</h2>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">No products found</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2 p-2">
                    {filteredProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
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
          {/* Network Error Banner - Prominent */}
          {networkError && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-red-600 text-xl">⚠️</span>
                <div className="flex-1">
                  <h3 className="text-red-900 font-semibold mb-1">No Internet Connection</h3>
                  <p className="text-red-800 text-sm mb-2">
                    Seller products are stored in Supabase and require an internet connection to load.
                    Currently showing static products only.
                  </p>
                  <button
                    onClick={fetchProducts}
                    className="text-sm text-red-700 hover:text-red-900 underline font-medium"
                  >
                    Retry Connection
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Results Header - Desktop Optimized */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {searchTerm ? `Search results for "${searchTerm}"` : 'All Products'}
              </h1>
              <div className="flex items-center gap-3">
                <p className="text-base text-gray-600">
                  {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
                  {!networkError && products.some(p => p.isSellerProduct || (p.isFromDatabase && p.seller_id)) && (
                    <span className="ml-2 text-sm text-green-600 font-semibold">
                      ({products.filter(p => p.isSellerProduct || (p.isFromDatabase && p.seller_id)).length} from sellers)
                    </span>
                  )}
                  {networkError && (
                    <span className="ml-2 text-sm text-red-600 font-semibold">
                      (Offline - Seller products unavailable)
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Sort and View Controls - Desktop */}
            <div className="flex items-center gap-4">
              {/* Diagnostic Button - Always show for debugging */}
              <button
                onClick={async () => {
                  console.log('🔍 DIAGNOSTIC: Checking database for seller products...');
                  try {
                    const { data: allProducts, error } = await supabase
                      .from('product')
                      .select('*')
                      .order('created_at', { ascending: false });
                    
                    if (error) {
                      console.error('❌ Diagnostic error:', error);
                      alert(`Error: ${error.message}`);
                      return;
                    }
                    
                    const sellerProducts = allProducts?.filter(p => p.seller_id) || [];
                    const allProductsCount = allProducts?.length || 0;
                    
                    console.log('📊 DIAGNOSTIC RESULTS:');
                    console.log(`   - Total products in database: ${allProductsCount}`);
                    console.log(`   - Products with seller_id: ${sellerProducts.length}`);
                    console.log(`   - Products in current state: ${products.length}`);
                    console.log(`   - Seller products in current state: ${products.filter(p => p.seller_id || p.isSellerProduct).length}`);
                    
                    if (sellerProducts.length > 0) {
                      console.log('✅ Seller products found in database:', sellerProducts.map(p => ({ 
                        id: p.id, 
                        name: p.name, 
                        seller_id: p.seller_id 
                      })));
                      alert(`✅ Found ${sellerProducts.length} seller products in database!\n\nCheck console for details.`);
                    } else {
                      console.warn('⚠️ No seller products in database!');
                      alert(`⚠️ No seller products found in database.\n\nTotal products: ${allProductsCount}\n\nCheck console for details.`);
                    }
                  } catch (err) {
                    console.error('Diagnostic failed:', err);
                    alert(`Error: ${err.message}`);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors bg-blue-100 text-blue-700 hover:bg-blue-200"
                title="Check database for seller products"
              >
                <span>🔍</span>
                <span>Check DB</span>
              </button>
              
              {/* Seller Products Filter Toggle */}
              {products.some(p => p.isSellerProduct || (p.isFromDatabase && p.seller_id)) && (
                <button
                  onClick={() => setFilters(prev => ({ ...prev, sellerOnly: !prev.sellerOnly }))}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    filters.sellerOnly
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>🏪</span>
                  <span>Seller Products</span>
                  {filters.sellerOnly && (
                    <span className="ml-1 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                      {products.filter(p => p.isSellerProduct || (p.isFromDatabase && p.seller_id)).length}
                    </span>
                  )}
                </button>
              )}
              
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
                ? 'grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6 lg:gap-8 p-2 md:p-4'
                : 'space-y-4'
            } style={{ overflow: 'visible' }}>
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