import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Star, ChevronRight, ChevronLeft, Timer, Menu, ChevronDown, Sparkles } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/SupabaseAuthContext";
import ProductCard from "../components/ProductCard";
import productsData from "../data/products.js";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const { getCartItemsCount } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [topDealIndex, setTopDealIndex] = useState(0);
  const [categoriesMenuOpenMobile, setCategoriesMenuOpenMobile] = useState(false);
  const [categoriesMenuOpenDesktop, setCategoriesMenuOpenDesktop] = useState(false);
  const [categoriesMenuOpenNavBar, setCategoriesMenuOpenNavBar] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [expandedCategoryMobile, setExpandedCategoryMobile] = useState(null);
  const [selectedCategoryMobile, setSelectedCategoryMobile] = useState(null);
  const bannerTimer = useRef(null);
  const topDealTimer = useRef(null);
  const categoriesMenuRefMobile = useRef(null);
  const categoriesMenuRefDesktop = useRef(null);
  const categoriesMenuRefNavBar = useRef(null);

  // Fetch products from database and combine with static products
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // Fetch products from database
      const { data: dbProducts, error: dbError } = await supabase
        .from('product')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) {
        console.error('Error fetching products from database:', dbError);
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

      const staticProducts = productsData.products || [];
      const combinedProducts = [...transformedDbProducts, ...staticProducts];
      const uniqueProducts = combinedProducts.reduce((acc, product) => {
        if (!acc.find(p => p.id === product.id)) {
          acc.push(product);
        }
        return acc;
      }, []);

      // Set featured and trending products
      setFeaturedProducts(uniqueProducts.slice(0, 20));
      setTrendingProducts(uniqueProducts.slice(0, 20));
    } catch (error) {
      console.error('Error fetching products:', error);
      setFeaturedProducts(productsData.products || []);
      setTrendingProducts(productsData.products || []);
    }
  };

  useEffect(() => {
    bannerTimer.current = setInterval(() => {
      setBannerIndex((i) => (i + 1) % 2);
    }, 5000);
    return () => bannerTimer.current && clearInterval(bannerTimer.current);
  }, []);

  // Auto-rotate Top Deals products
  useEffect(() => {
    if (trendingProducts.length > 0) {
      topDealTimer.current = setInterval(() => {
        setTopDealIndex((i) => (i + 1) % Math.min(5, trendingProducts.length));
      }, 4000);
      return () => topDealTimer.current && clearInterval(topDealTimer.current);
    }
  }, [trendingProducts.length]);

  // Note: Using onMouseEnter/onMouseLeave instead of click handlers for hover functionality

  const handleCategoryClick = (categoryName, menuType = 'all') => {
    if (categoryName) {
      navigate(`/shop?category=${encodeURIComponent(categoryName)}`);
    } else {
      navigate('/shop');
    }
    // Close all menus
    setCategoriesMenuOpenMobile(false);
    setCategoriesMenuOpenDesktop(false);
    setCategoriesMenuOpenNavBar(false);
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
      cta: { label: "Shop Electronics", to: "/shop?category=Electronics" }
    },
    {
      title: "Fashion Week Deals",
      subtitle: "Trending styles and accessories",
      image: productsData.products?.[4]?.images?.[0],
      cta: { label: "Shop Fashion", to: "/shop?category=Fashion" }
    }
  ];

  // Get top 3 deal products for the boxes
  const topDealProducts = trendingProducts.slice(0, 4);

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
    { label: 'Local shipping', to: '/shop?tag=local-shipping' },
    { label: 'Home & Furniture', to: '/shop?category=Home%20%26%20Furniture' },
    { label: 'Weekly deals', to: '/shop?tag=weekly-deals' },
    { label: 'Top Brands', to: '/shop?tag=top-brands' },
    { label: 'Choice', to: '/shop?tag=choice' },
    { label: 'FunTime', to: '/shop?tag=funtime' },
    { label: 'More', to: '/shop' }
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
          className={`absolute left-2 bg-black/80 text-white ${
            micro ? 'text-[6.5px]' : ultraCompact ? 'text-[7.5px]' : isUltra ? 'text-[9px]' : 'text-[11px]'
          } font-semibold px-1.5 py-[2px] rounded-full tracking-wide ${
            micro ? 'top-1' : ultraCompact ? 'top-1.5' : isUltra ? 'top-2' : 'top-3'
          }`}
        >
          {deal.priceLabel}
        </span>
        <span
          className={`absolute right-2 bg-[#ff4747] text-white ${
            micro ? 'text-[6.5px]' : ultraCompact ? 'text-[7.5px]' : isUltra ? 'text-[9px]' : 'text-[11px]'
          } font-semibold px-1.5 py-[2px] rounded-full ${
            micro ? 'top-1' : ultraCompact ? 'top-1.5' : isUltra ? 'top-2' : 'top-3'
          }`}
        >
          -{deal.discount}%
        </span>
        <div className={`w-full ${micro ? 'mt-2' : ultraCompact ? 'mt-2.5' : compact ? 'mt-4' : 'mt-8'}`}>
          <div
            className={`mx-auto aspect-square ${
              micro
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
          className={`${
            micro ? 'mt-1 text-[8px]' : ultraCompact ? 'mt-1.5 text-[9px]' : compact ? 'mt-3 text-[11px]' : 'mt-4 text-xs sm:text-sm'
          } font-semibold text-gray-800 leading-tight line-clamp-2 px-2`}
        >
          {deal.name}
        </p>
        {deal.tag && (
          <span
            className={`${
              micro
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
  
  // Debug: Log categories to verify they're loaded
  useEffect(() => {
    console.log('Categories loaded:', categories.length, 'categories');
    console.log('Categories data:', categories);
    if (categories.length === 0) {
      console.warn('No categories found in productsData:', productsData);
    }
  }, []);

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
        {/* Mobile Hero Banner - At Top */}
        <section className="px-1.5 py-1 bg-white">
          <div className="relative overflow-hidden rounded-md bg-gradient-to-r from-[#ff3b30] via-[#ff4d3d] to-[#ff6e48] text-white">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.35),_transparent_55%)]" />
            <div className="relative py-1">
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
                    className="inline-flex items-center gap-0.5 bg-white text-[#ff3b30] font-semibold px-1.5 py-0.5 rounded-full shadow hover:bg-white/80 transition-colors text-[7px]"
                  >
                    Shop
                    <ChevronRight className="w-2 h-2" />
                  </button>
                </div>

                <div className="flex gap-1 overflow-x-auto">
                  {heroDeals.slice(0, 2).map((deal, index) => (
                    <HeroDealCard
                      key={deal.id || index}
                      deal={deal}
                      ultraCompact
                      micro
                      className="min-w-[35px] flex-shrink-0"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Recommended Products - Mobile */}
        <div className="bg-white border-t border-gray-200">
          <div className="px-3 py-3 border-b border-gray-100">
            <h2 className="text-base font-bold text-gray-900">Recommended for you</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 p-3">
            {featuredProducts && featuredProducts.length > 0 ? (
              featuredProducts.slice(0, 20).map((product) => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="flex flex-col bg-white rounded overflow-hidden active:scale-95 transition-transform border border-gray-100"
                >
                  <div className="relative aspect-square bg-gray-50 flex items-center justify-center">
                    <img
                      src={product.images?.[0] || 'https://via.placeholder.com/150?text=No+Image'}
                      alt={product.name}
                      className="w-full h-full object-contain p-2"
                    />
                    {product.discount && (
                      <span className="absolute top-2 right-2 bg-red-600 text-white text-xs font-semibold px-2 py-1 rounded">
                        -{product.discount}%
                      </span>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs text-gray-800 font-medium line-clamp-2 leading-tight mb-1 min-h-[2.5rem]">
                      {product.name}
                    </p>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-bold text-red-600">
                        {product.currency || 'ETB'}{formatPrice(product.price || 0)}
                      </span>
                      {product.originalPrice && (
                        <span className="text-xs text-gray-400 line-through">
                          {product.currency || 'ETB'}{formatPrice(product.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-2 p-4 text-center text-gray-500 text-sm">
                No products available
              </div>
            )}
          </div>
        </div>

        {/* Mobile Recommendations / Category Pills */}
        <div className="px-3 py-3 bg-gray-50 border-t border-gray-200">
            <div className="mb-2 px-1 flex items-center justify-between">
              <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Recommendations</h3>
              <Link 
                to="/shop" 
                className="text-xs font-medium text-orange-600 hover:text-orange-700 transition-colors"
              >
                View All →
              </Link>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              {/* Recommendation Pills */}
              {heroNavLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="flex-shrink-0 inline-flex items-center justify-center px-4 py-2.5 bg-white text-gray-700 border-2 border-gray-200 rounded-full font-semibold text-xs uppercase tracking-wide shadow-sm hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100 active:scale-95 transition-all whitespace-nowrap"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

        {/* More to love Section */}
        <div className="bg-white py-4 border-t border-gray-200 pb-20">
          <div className="px-4 mb-3">
            <h2 className="text-gray-600 text-sm font-medium">More to love</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 px-4">
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
        <div className="bg-gradient-to-b from-[#fff4ef] via-white to-white pb-16">
          {/* Full-width hero banner */}
          <section className="px-2 sm:px-4 lg:px-6 pt-3">
            <div className="relative bg-gradient-to-r from-[#ff3b30] via-[#ff4d3d] to-[#ff6e48] text-white rounded-3xl shadow-lg overflow-hidden border border-[#ff8a70]">
                <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.45),_transparent_60%)]" />
                <div className="relative">
                {heroCategories.length > 0 && (
                  <div className="px-3 pb-1.5">
                    <div className="flex items-center gap-2 overflow-x-auto">
                      {heroCategories.map((category, index) => (
                        <Link
                          key={`hero-desktop-${category.id || index}`}
                          to={`/shop?category=${encodeURIComponent(category.name)}`}
                          className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 transition-colors px-3 py-1.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
                        >
                          <span className="text-xl">{category.icon || '📦'}</span>
                          <span>{category.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="px-3 pb-2">
                  <div className="grid gap-2 xl:grid-cols-[110px_minmax(0,1fr)_110px] items-stretch">
                    {heroDeals[0] && (
                      <HeroDealCard deal={heroDeals[0]} ultraCompact micro className="hidden lg:flex w-full h-full p-1.5" />
                    )}

                    <div className="flex flex-col justify-between space-y-2 text-left">
                      <span className="inline-flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/80">
                        Welcome deal
                      </span>
                      <h2 className="text-[18px] lg:text-[20px] font-bold leading-snug max-w-md">
                        Catch limited-time savings for new shoppers
                      </h2>
                      <p className="text-[9.5px] text-white/80 max-w-lg">
                        Enjoy fresh picks across electronics, lifestyle, and beyond—curated to deliver the biggest value on your first EcoExpress haul.
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          onClick={() => navigate('/shop?tag=welcome-deal')}
                          className="inline-flex items-center gap-1 bg-white text-[#ff3b30] font-semibold px-2.5 py-1.5 rounded-full shadow-md hover:bg-white/90 transition-colors text-[10px]"
                        >
                          Shop now
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wide">
                          <span className="bg-white text-[#ff3b30] rounded-full px-2 py-0.5">
                            -{heroDeals[0]?.discount || 80}%
                          </span>
                          <span>exclusive welcome deal</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-1.5">
                      {heroDeals.slice(1).map((deal, index) => (
                        <HeroDealCard
                          key={deal.id || index}
                          deal={deal}
                          ultraCompact
                          micro
                          className="w-full h-full p-1.5"
                        />
                      ))}
                    </div>
                  </div>
                </div>
                </div>
            </div>
          </section>

          {/* Desktop Category Pills */}
          <div className="px-2 sm:px-4 lg:px-6 pt-4">
            <div className="max-w-7xl mx-auto">
              <div className="relative overflow-visible">
                <div className="relative overflow-hidden rounded-full bg-white text-gray-700 border border-gray-200 shadow-sm">
                  <div className="relative flex items-center gap-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.13em] overflow-x-auto">
                    <div 
                      className="relative" 
                      ref={categoriesMenuRefDesktop}
                      onMouseEnter={() => {
                        console.log('Mouse entered desktop');
                        setCategoriesMenuOpenDesktop(true);
                      }}
                      onMouseLeave={() => {
                        console.log('Mouse left desktop');
                        setCategoriesMenuOpenDesktop(false);
                      }}
                    >
                      <button 
                        type="button"
                        className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 transition-colors px-3 py-1 rounded-full whitespace-nowrap"
                      >
                        <Menu className="w-4 h-4" />
                        <span>All Categories</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${categoriesMenuOpenDesktop ? 'rotate-180' : ''}`} />
                      </button>
                      {categoriesMenuOpenDesktop && (
                        <>
                          {/* Backdrop overlay */}
                          <div 
                            className="fixed inset-0 bg-black/50 z-[90]"
                            onClick={() => setCategoriesMenuOpenDesktop(false)}
                          />
                          {/* Sidebar menu */}
                          <div 
                            className="fixed left-0 top-0 bottom-0 w-72 bg-white shadow-2xl z-[100] overflow-y-auto"
                            onMouseEnter={(e) => {
                              e.stopPropagation();
                              setCategoriesMenuOpenDesktop(true);
                            }}
                            onMouseLeave={() => {
                              setCategoriesMenuOpenDesktop(false);
                            }}
                          >
                            <div className="px-4 py-4 border-b border-gray-200 bg-gray-50">
                              <div className="flex items-center gap-3">
                                <Menu className="w-5 h-5 text-gray-800" />
                                <h2 className="text-base font-bold text-gray-900 uppercase tracking-wide">ALL CATEGORIES</h2>
                              </div>
                            </div>
                            <div className="py-0 relative">
                              {categories && categories.length > 0 ? (
                                categories.map((category) => (
                                  <div
                                    key={category.id || category.name}
                                    className="relative"
                                    onMouseEnter={() => setHoveredCategory(category)}
                                    onMouseLeave={() => setHoveredCategory(null)}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => handleCategoryClick(category.name)}
                                      className="w-full text-left px-4 py-3 text-sm font-normal text-gray-800 hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center gap-3 border-b border-gray-200 last:border-b-0"
                                      title={`Browse ${category.name} products`}
                                    >
                                      <span className="text-xl flex-shrink-0">{category.icon || '📦'}</span>
                                      <span className="flex-1 text-gray-700">{category.name}</span>
                                    </button>
                                    {hoveredCategory?.id === category.id && category.subcategories && category.subcategories.length > 0 && (
                                      <div className="fixed left-72 top-0 bottom-0 w-auto min-w-[400px] max-w-[600px] bg-white shadow-xl z-[110] overflow-y-auto border-l border-gray-200">
                                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                                          <h3 className="text-sm font-bold text-gray-900 uppercase">{category.name}</h3>
                                        </div>
                                        <div className="p-4 grid grid-cols-2 gap-2">
                                          {category.subcategories.map((subcategory, idx) => (
                                            <button
                                              key={idx}
                                              type="button"
                                              onClick={() => {
                                                handleCategoryClick(category.name);
                                                setHoveredCategory(null);
                                              }}
                                              className="text-left px-4 py-2.5 text-sm font-normal text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors rounded border border-gray-200 hover:border-gray-300"
                                            >
                                              {subcategory}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <div className="px-6 py-4 text-sm text-gray-500">
                                  No categories available
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    {heroNavLinks.map((link) => (
                      <Link
                        key={link.label}
                        to={link.to}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors whitespace-nowrap"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
            {/* Flash deals section */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-900">Flash deals</h2>
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#ff4747]">
                    <Timer className="w-4 h-4" />
                    <span>Ends in 21:11:01</span>
                  </div>
                </div>
                <Link to="/shop" className="flex items-center gap-1 text-sm font-semibold text-[#ff4747] hover:text-[#ff2e2e]">
                  View all
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {topDealProducts.map((product, index) => (
                  <Link
                    key={product.id || index}
                    to={`/product/${product.id}`}
                    className="group bg-white border border-gray-200 rounded-2xl hover:border-[#ffb498] hover:shadow-lg transition-all overflow-hidden"
                  >
                    <div className="relative aspect-square bg-gray-50 flex items-center justify-center">
                      <img
                        src={product.images?.[0] || 'https://via.placeholder.com/200'}
                        alt={product.name}
                        className="w-full h-full object-contain p-6 group-hover:scale-105 transition-transform"
                      />
                      {product.discount && (
                        <span className="absolute top-4 left-4 bg-[#ff4747] text-white text-xs font-semibold px-3 py-1 rounded-full">
                          -{product.discount}%
                        </span>
                      )}
                    </div>
                    <div className="p-5 space-y-3">
                      <p className="text-sm text-gray-700 line-clamp-2 min-h-[2.5rem]">{product.name}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-[#ff4747]">ETB{formatPrice(product.price || 0)}</span>
                        {product.originalPrice && (
                          <span className="text-xs text-gray-400 line-through">ETB{formatPrice(product.originalPrice)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Star className="w-4 h-4 text-[#ffb266] fill-current" />
                        <span>{product.rating?.toFixed(1) || '4.8'} ({product.reviewCount || '120'} reviews)</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            {/* Choice picks */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-6">
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
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                {trendingProducts.slice(0, 10).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>

            {/* Recommended products */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Recommended for you</h2>
                <Link to="/shop" className="text-sm font-semibold text-[#ff4747] hover:text-[#ff2e2e] flex items-center gap-1">
                  View all
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
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

