import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Star, ChevronRight, ChevronLeft, Menu, ChevronDown, Sparkles } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/SupabaseAuthContext";
import ProductCard from "../components/ProductCard";
import CategoryPromoBanner from "../components/CategoryPromoBanner";
import productsData from "../data/products.js";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const { getCartItemsCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // Store all products
  const [selectedCategory, setSelectedCategory] = useState(null); // Selected category for filtering
  const [bannerIndex, setBannerIndex] = useState(0);
  const [topDealIndex, setTopDealIndex] = useState(0);
  const [categoriesMenuOpenMobile, setCategoriesMenuOpenMobile] = useState(false);
  const [categoriesMenuOpenDesktop, setCategoriesMenuOpenDesktop] = useState(false);
  const bannerTimer = useRef(null);
  const topDealTimer = useRef(null);
  const categoriesMenuRefMobile = useRef(null);

  // Fetch products from database and combine with static products
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      let dbProducts = null;

      try {
        // Fetch products from database
        const { data, error: dbError } = await supabase
          .from('product')
          .select('*')
          .order('created_at', { ascending: false });

        if (dbError) {
          // Check if it's a network error
          if (dbError.message?.includes('Failed to fetch') ||
            dbError.message?.includes('ERR_NAME_NOT_RESOLVED') ||
            dbError.message?.includes('NetworkError') ||
            dbError.code === 'PGRST116') {
            console.warn('Network error fetching products. This might be due to:');
            console.warn('1. Internet connectivity issues');
            console.warn('2. Supabase project might be paused (free tier) - check your Supabase dashboard');
            console.warn('3. Firewall or proxy blocking the request');
            console.warn('Error details:', dbError);
          } else {
            console.error('Error fetching products from database:', dbError);
          }
          // Continue with static products if database fetch fails
          dbProducts = null;
        } else {
          dbProducts = data;
        }
      } catch (networkError) {
        // Catch network errors that might be thrown as exceptions
        if (networkError?.message?.includes('Failed to fetch') ||
          networkError?.message?.includes('ERR_NAME_NOT_RESOLVED') ||
          networkError?.name === 'TypeError' ||
          networkError?.name === 'NetworkError') {
          console.warn('Network error fetching products (caught as exception). This might be due to:');
          console.warn('1. Internet connectivity issues');
          console.warn('2. Supabase project might be paused (free tier) - check your Supabase dashboard');
          console.warn('3. Firewall or proxy blocking the request');
          console.warn('4. DNS resolution failure');
          console.warn('Error details:', networkError);
        } else {
          console.error('Unexpected error fetching products:', networkError);
        }
        // Continue with static products if database fetch fails
        dbProducts = null;
      }

      // If database fetch failed, use only static products
      if (!dbProducts) {
        setFeaturedProducts(productsData.products || []);
        setTrendingProducts(productsData.products || []);
        return;
      }


      // Helper function to convert image paths to public URLs
      const convertToPublicUrl = (imagePath) => {
        if (!imagePath || typeof imagePath !== 'string') {
          return null;
        }

        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
          return imagePath;
        }

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

      // Transform database products
      const transformedDbProducts = (dbProducts || []).map(product => {
        let imageArray = [];
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
          imageArray = product.images;
        } else if (product.image_url) {
          if (Array.isArray(product.image_url)) {
            imageArray = product.image_url;
          } else if (typeof product.image_url === 'string' && product.image_url.trim()) {
            imageArray = [product.image_url];
          }
        }

        const convertedImages = imageArray
          .map(img => {
            if (typeof img === 'string') {
              const trimmed = img.trim();
              if (trimmed.includes('via.placeholder.com')) {
                return null;
              }
              return convertToPublicUrl(trimmed) || (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image') ? trimmed : null);
            }
            return null;
          })
          .filter(img => img !== null);

        return {
          id: product.id,
          name: product.name,
          description: product.description || '',
          price: product.price || 0,
          currency: product.currency || 'ETB',
          images: convertedImages,
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

      const staticProducts = productsData.products || [];
      const combinedProducts = [...transformedDbProducts, ...staticProducts];
      const uniqueProducts = combinedProducts.reduce((acc, product) => {
        if (!acc.find(p => p.id === product.id)) {
          acc.push(product);
        }
        return acc;
      }, []);

      // Filter out products without images
      const productsWithImages = uniqueProducts.filter(p => (p.images?.[0] || p.image));

      // Store all products
      setAllProducts(productsWithImages);
      // Set featured and trending products
      setFeaturedProducts(productsWithImages.slice(0, 20));
      setTrendingProducts(productsWithImages.slice(0, 20));
    } catch (error) {
      console.error('Error fetching products:', error);
      const fallbackProducts = productsData.products || [];
      setAllProducts(fallbackProducts);
      setFeaturedProducts(fallbackProducts.slice(0, 20));
      setTrendingProducts(fallbackProducts.slice(0, 20));
    }
  };

  useEffect(() => {
    // Clear any existing timer first
    if (bannerTimer.current) {
      clearInterval(bannerTimer.current);
      bannerTimer.current = null;
    }

    bannerTimer.current = setInterval(() => {
      setBannerIndex((i) => (i + 1) % 2);
    }, 5000);

    return () => {
      if (bannerTimer.current) {
        clearInterval(bannerTimer.current);
        bannerTimer.current = null;
      }
    };
  }, []);

  // Auto-rotate Top Deals products
  useEffect(() => {
    // Clear any existing timer first
    if (topDealTimer.current) {
      clearInterval(topDealTimer.current);
      topDealTimer.current = null;
    }

    if (trendingProducts.length > 0) {
      topDealTimer.current = setInterval(() => {
        setTopDealIndex((i) => (i + 1) % Math.min(5, trendingProducts.length));
      }, 4000);
    }

    return () => {
      if (topDealTimer.current) {
        clearInterval(topDealTimer.current);
        topDealTimer.current = null;
      }
    };
  }, [trendingProducts.length]);

  // Note: Using onMouseEnter/onMouseLeave instead of click handlers for hover functionality

  const handleCategoryClick = (categoryName, menuType = 'all') => {
    if (categoryName) {
      navigate(`/category/${encodeURIComponent(categoryName)}`);
    } else {
      navigate('/shop');
    }
    // Close all menus
    setCategoriesMenuOpenMobile(false);
    setCategoriesMenuOpenDesktop(false);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  // Desktop banners
  const banners = [
    {
      title: "Global Shopping Festival",
      subtitle: "Up to 60% off electronics",
      image: productsData.products?.[1]?.images?.[0],
      cta: { label: "Shop Electronics", to: "/category/Electronics" }
    },
    {
      title: "Fashion Week Deals",
      subtitle: "Trending styles and accessories",
      image: productsData.products?.[4]?.images?.[0],
      cta: { label: "Shop Fashion", to: "/category/Fashion" }
    }
  ];

  // Get top 10 products for the recommended sections
  const topDealProducts = trendingProducts.slice(0, 10);

  const defaultHeroDeals = [
    {
      id: 'fallback-1',
      name: 'Compact Dish Rack Bundle',
      price: 0.99,
      discount: 88,
      image: 'https://images.unsplash.com/photo-1626942386447-4d628739dc68?auto=format&fit=crop&w=400&q=80',
      tag: 'Kitchen essentials'
    },
    {
      id: 'fallback-2',
      name: 'Smart Fitness Tracker',
      price: 36.0,
      discount: 62,
      image: 'https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=400&q=80',
      tag: 'Wearables'
    },
    {
      id: 'fallback-3',
      name: 'Minimalist Apparel Pack',
      price: 48.0,
      discount: 54,
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=400&q=80',
      tag: 'Style picks'
    }
  ];

  const heroSource = topDealProducts.length > 0 ? topDealProducts : defaultHeroDeals;
  const heroDeals = heroSource.slice(0, 3).map((product, index) => {
    const fallback = defaultHeroDeals[index] || defaultHeroDeals[0];
    const priceValue = product.price || fallback.price || (index + 1) * 20;
    return {
      id: product.id || fallback.id || `hero-${index}`,
      name: product.name || fallback.name,
      image: product.images?.[0] || product.image || fallback.image,
      priceLabel: `ETB${formatPrice(priceValue)}`,
      discount: product.discount || fallback.discount || [88, 62, 54][index] || 40,
      tag: index === 0 ? 'Welcome deal' : index === 1 ? 'Hot pick' : 'Limited stock'
    };
  });

  const heroNavLinks = [
    { label: 'Dollar Express', to: '/shop?tag=dollar-express' },
    { label: 'Mobile & Tablets', to: '/category/Mobile%20%26%20Tablets' },
    { label: 'Home & Furniture', to: '/category/Home%20%26%20Furniture' },
    { label: 'Headphones', to: '/category/Mobile%20%26%20Tablets?subcategory=Headphones' },
    { label: 'Top Brands', to: '/shop?tag=top-brands' },
    { label: 'Choice', to: '/shop?tag=choice' },
    { label: 'FunTime', to: '/shop?tag=funtime' },
    { label: 'More', to: '/categories' } // Changed to categories list if it exists, or keep as shop
  ];

  const HeroDealCard = ({
    deal,
    className = '',
    compact = false,
    ultraCompact = false,
    micro = false
  }) => {
    if (!deal) return null;
    const isUltra = micro || ultraCompact || compact;
    return (
      <div className={`relative flex flex-col items-center text-center bg-white/95 backdrop-blur rounded-2xl shadow-md border border-white/30 ${className}`}>
        <span
          className={`absolute left-2 bg-black/80 text-white ${micro ? 'text-[6.5px]' : ultraCompact ? 'text-[7.5px]' : isUltra ? 'text-[9px]' : 'text-[11px]'
            } font-semibold px-1.5 py-[2px] rounded-full tracking-wide ${micro ? 'top-1' : ultraCompact ? 'top-1.5' : isUltra ? 'top-2' : 'top-3'
            }`}
        >
          {deal.priceLabel}
        </span>
        <span
          className={`absolute right-2 bg-[#ff4747] text-white ${micro ? 'text-[6.5px]' : ultraCompact ? 'text-[7.5px]' : isUltra ? 'text-[9px]' : 'text-[11px]'
            } font-semibold px-1.5 py-[2px] rounded-full ${micro ? 'top-1' : ultraCompact ? 'top-1.5' : isUltra ? 'top-2' : 'top-3'
            }`}
        >
          -{deal.discount}%
        </span>
        <div className={`w-full ${micro ? 'mt-2' : ultraCompact ? 'mt-2.5' : compact ? 'mt-4' : 'mt-8'}`}>
          <div
            className={`mx-auto aspect-video md:aspect-square ${micro
              ? 'w-[45%] max-w-[48px]'
              : ultraCompact
                ? 'w-[55%] max-w-[60px]'
                : compact
                  ? 'w-[80%] max-w-[110px]'
                  : 'w-[90%] max-w-[130px]'
              } rounded-xl bg-white shadow-inner flex items-center justify-center overflow-hidden`}
          >
            <img
              src={deal.image || 'https://via.placeholder.com/180?text=Deal'}
              alt={deal.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <p
          className={`${micro ? 'mt-1 text-[8px]' : ultraCompact ? 'mt-1.5 text-[9px]' : compact ? 'mt-3 text-[11px]' : 'mt-4 text-xs sm:text-sm'
            } font-semibold text-gray-800 leading-tight line-clamp-2 px-2`}
        >
          {deal.name}
        </p>
        {deal.tag && (
          <span
            className={`${micro
              ? 'mt-0.5 mb-1 text-[6.5px]'
              : ultraCompact
                ? 'mt-1 mb-1.5 text-[7.5px]'
                : compact
                  ? 'mt-1 mb-3 text-[9px]'
                  : 'mt-1 mb-4 text-[10px]'
              } inline-flex items-center justify-center px-2 py-0.5 font-semibold uppercase tracking-wide text-[#ff4747] bg-[#ffe7db] rounded-full`}
          >
            {deal.tag}
          </span>
        )}
      </div>
    );
  };

  // Categories for desktop
  const categories = productsData.categories || [];
  const heroCategories = categories.slice(0, 8);

  // Filter products based on selected category
  const getFilteredProducts = () => {
    if (!selectedCategory) {
      return allProducts;
    }
    return allProducts.filter(product =>
      product.category && product.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  };

  const filteredProducts = getFilteredProducts();
  const displayProducts = selectedCategory ? filteredProducts : featuredProducts;

  // Debug: Log categories to verify they're loaded (only once when categories change)
  useEffect(() => {
    if (categories.length > 0) {
      if (import.meta.env.DEV) {
        console.log('Categories loaded:', categories.length, 'categories');
      }
    }
  }, [categories.length]); // Only depend on length to avoid excessive logging

  const handleBannerPrev = () => {
    setBannerIndex((i) => (i - 1 + banners.length) % banners.length);
  };

  const handleBannerNext = () => {
    setBannerIndex((i) => (i + 1) % banners.length);
  };

  const currentBanner = banners[bannerIndex];

  return (
    <div className="min-h-screen bg-white">
      {/* MOBILE ONLY: AliExpress-style Layout */}
      <div className="md:hidden bg-white pb-20">
        {/* Mobile Hero Banner - At Top - Spaced below header */}
        <section className="pt-0 pb-3 bg-white">
          <div className="relative overflow-hidden bg-[#3b82f6] text-white min-h-[130px] shadow-xl">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.35),_transparent_55%)]" />
            <div className="relative py-3 px-3">
              <div className="flex items-center gap-1.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-[6px] font-semibold uppercase tracking-wide text-white/70 whitespace-nowrap">
                      Welcome
                    </span>
                    <h2 className="text-[9px] font-semibold leading-tight truncate">New shopper special</h2>
                  </div>
                  <button
                    onClick={() => navigate('/shop?tag=welcome-deal')}
                    className="inline-flex items-center gap-0.5 bg-white text-[#3b82f6] font-semibold px-1.5 py-0.5 rounded-full shadow hover:bg-white/80 transition-colors text-[7px]"
                  >
                    Shop
                    <ChevronRight className="w-2 h-2" />
                  </button>
                </div>

                <div className="flex gap-1.5 overflow-x-auto">
                  {heroDeals.slice(0, 2).map((deal, index) => (
                    <HeroDealCard
                      key={deal.id || index}
                      deal={deal}
                      ultraCompact
                      micro
                      className="min-w-[40px] flex-shrink-0"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile Categories - Under Banner */}
        <div className="px-3 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
            <span className="flex-shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-700">
              Recommendations
            </span>
            {/* Real category pills (inline with heading) - Redirect to category page */}
            {(productsData.categories || []).slice(0, 12).map((category, idx) => (
              <Link
                key={category.id || `${category.name}-${idx}`}
                to={`/category/${encodeURIComponent(category.name)}`}
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 bg-white text-gray-700 border-2 border-gray-200 rounded-full font-semibold text-xs uppercase tracking-wide shadow-sm hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100 active:scale-95 transition-all whitespace-nowrap"
                title={`Browse ${category.name}`}
              >
                {category.icon ? <span className="text-sm">{category.icon}</span> : null}
                <span>{category.name}</span>
              </Link>
            ))}
            <Link
              to="/shop"
              className="flex-shrink-0 text-xs font-medium text-orange-600 hover:text-orange-700 transition-colors ml-auto pr-1"
            >
              View All →
            </Link>
          </div>
        </div>

        {/* Recommended Products - Mobile */}
        <div className="bg-white border-t border-gray-200">
          <div className="px-3 py-3 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">Recommended for you</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 p-2">
            {featuredProducts && featuredProducts.length > 0 ? (
              featuredProducts.slice(0, 20).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-2 p-4 text-center text-gray-500 text-sm">
                No products available
              </div>
            )}
          </div>
        </div>

        {/* More to love Section */}
        <div className="bg-white py-4 border-t border-gray-200 pb-20">
          <div className="px-4 mb-3">
            <h2 className="text-gray-600 text-sm font-medium">More to love</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 px-2">
            {featuredProducts && featuredProducts.length > 0 ? (
              featuredProducts.slice(0, 10).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-2 p-4 text-center text-gray-500 text-sm">
                No products available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DESKTOP ONLY: AliExpress-inspired layout */}
      <div className="hidden md:block">
        <div className="bg-gradient-to-b from-blue-50 via-white to-white pb-16">
          {/* Full-width hero banner */}
          <section className="pt-0">
            <div className="relative bg-[#3b82f6] text-white shadow-xl overflow-hidden border-y border-blue-400">
              <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.45),_transparent_60%)]" />
              <div className="relative px-6 py-5">
                <div className="flex items-center justify-between gap-6">
                  <div className="flex flex-col space-y-2 flex-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-white/80">
                      Welcome deal
                    </span>
                    <h2 className="text-xl lg:text-2xl font-bold leading-snug max-w-md">
                      Catch limited-time savings for new shoppers
                    </h2>
                    <p className="text-[11px] text-white/80 max-w-lg">
                      Enjoy fresh picks across electronics, lifestyle, and beyond—curated to deliver the biggest value on your first Kush deals haul.
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => navigate('/shop?tag=welcome-deal')}
                        className="inline-flex items-center gap-1.5 bg-white text-[#3b82f6] font-semibold px-5 py-2.5 rounded-full shadow-md hover:bg-white/90 transition-colors text-sm"
                      >
                        Shop now
                        <ChevronRight className="w-5 h-5" />
                      </button>
                      <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-wide">
                        <span className="bg-white text-[#3b82f6] rounded-full px-2.5 py-1">
                          -{heroDeals[0]?.discount || 80}%
                        </span>
                        <span>exclusive welcome deal</span>
                      </div>
                    </div>
                  </div>
                  {heroDeals[0] && (
                    <div className="hidden lg:block">
                      <HeroDealCard deal={heroDeals[0]} ultraCompact micro className="w-32 h-32 p-2.5" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Featured Sections */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Recommended for you */}
            <section className="bg-white md:bg-transparent rounded-2xl md:rounded-none border border-gray-200 md:border-0 shadow-sm md:shadow-none px-6 md:px-0 py-6 md:py-0">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Recommended for you</h2>
                </div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 p-2 md:p-0">
                {topDealProducts.map((product, index) => (
                  <ProductCard key={product.id || index} product={product} />
                ))}
              </div>
            </section>

            {/* Promo Banner Ad Section - Moved between Recommended and Choice */}
            <div className="my-8">
              <CategoryPromoBanner
                products={allProducts.filter(p => (p.isSuperDeal || (p.isFromDatabase && p.discount && p.discount > 0)) && (p.images?.[0] || p.image))}
                title="SuperDeals"
              />
            </div>

            {/* Choice picks */}
            <section className="bg-white md:bg-transparent rounded-2xl md:rounded-none border border-gray-200 md:border-0 shadow-sm md:shadow-none px-6 md:px-0 py-6 md:py-0">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Choice picks for you</h2>
                  <p className="text-sm text-gray-500 mt-1">Curated items with premium guarantees and fast delivery.</p>
                </div>
                <Link to="/shop" className="flex items-center gap-1 text-sm font-semibold text-[#ff4747] hover:text-[#ff2e2e]">
                  Discover more
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 p-2 md:p-0">
                {trendingProducts.slice(0, 10).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>

            {/* Recommended products */}
            <section className="bg-white md:bg-transparent rounded-2xl md:rounded-none border border-gray-200 md:border-0 shadow-sm md:shadow-none px-6 md:px-0 py-6 md:py-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Recommended for you</h2>
                <Link to="/shop" className="text-sm font-semibold text-[#ff4747] hover:text-[#ff2e2e] flex items-center gap-1">
                  View all
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 p-2 md:p-0">
                {featuredProducts.slice(0, 12).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

