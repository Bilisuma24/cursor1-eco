import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Star, Truck, Shield, ChevronRight, ChevronLeft, Heart, Timer, Menu, ChevronDown, Sparkles } from "lucide-react";
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
  const bannerTimer = useRef(null);
  const topDealTimer = useRef(null);

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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  // Super deals data
  const superDeals = trendingProducts.slice(0, 3).map((product, index) => ({
    id: product.id,
    name: product.name,
    product,
    title: index === 0 ? 'SuperDeals' : index === 1 ? 'Brand deals' : 'Viva',
    subtitle: index === 1 ? '750+ brands' : index === 2 ? 'Your fashion' : '',
    timer: index === 0 ? '21:11:01' : null,
    image: product.images?.[0],
    price: product.price,
    originalPrice: product.originalPrice || product.price * 1.5,
  }));

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

  // Categories for desktop
  const categories = productsData.categories || [];

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
      <div className="md:hidden">
        <div className="bg-white pb-20">
          {/* Search Bar */}
          <div className="bg-white px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <button className="bg-gray-900 text-white rounded-full p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Categories Section - Mobile */}
          <div className="bg-white px-4 py-3 border-b border-gray-200">
            <div className="mb-2">
              <h2 className="text-xs font-semibold text-gray-900">Categories</h2>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {categories.slice(0, 8).map((category, index) => (
                <Link
                  key={index}
                  to={`/shop?category=${encodeURIComponent(category.name)}`}
                  className="flex flex-col items-center"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mb-0.5">
                    <span className="text-xl">{category.icon || '📦'}</span>
                  </div>
                  <span className="text-[10px] text-gray-700 text-center line-clamp-2">{category.name}</span>
                </Link>
              ))}
            </div>
            {categories.length > 8 && (
              <Link
                to="/shop"
                className="block text-center mt-3 text-sm text-orange-500 font-medium"
              >
                View All Categories →
              </Link>
            )}
          </div>

          {/* Category Navigation Bar */}
          <div className="bg-white border-b border-gray-200">
            <div className="px-4 py-2 overflow-x-auto">
              <div className="flex items-center gap-4 min-w-max">
                <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded whitespace-nowrap">
                  <Menu className="w-4 h-4" />
                  <span>All Categories</span>
                </button>
                <Link to="/shop" className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded whitespace-nowrap">
                  Choice
                </Link>
                <Link to="/shop" className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded whitespace-nowrap">
                  SuperDeals
                </Link>
                <Link to="/shop" className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded whitespace-nowrap">
                  AliExpress Business
                </Link>
                <Link to="/shop" className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded whitespace-nowrap">
                  Home Improvement & Lighting
                </Link>
                <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded whitespace-nowrap">
                  <span>More</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Promotional Section with Discount Codes */}
          <div className="bg-orange-200 px-2 sm:px-3 py-2 border-b border-gray-200">
            {/* Sale Timer Header - Single Line */}
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm sm:text-base font-bold text-gray-900 flex-shrink-0">Super Deal</span>
              <div className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">
                <span className="text-[9px] sm:text-[10px]">Up to 70% off</span>
                <ChevronRight className="w-2.5 h-2.5" />
              </div>
            </div>

            {/* Horizontal Layout: Top Deal Products | Product | Festive Graphic */}
            <div className="flex gap-2 sm:gap-2.5 pb-2 px-2">
              {/* Top Deal Product Boxes - Horizontal Row */}
              <div className="flex gap-2 sm:gap-2.5 w-full">
                {topDealProducts.map((product, index) => (
                  <div
                    key={product.id || index}
                    className="bg-gradient-to-br from-white to-pink-50 border-2 border-dashed border-pink-400 rounded-md p-2 sm:p-2.5 flex-1 shadow-sm hover:shadow-md transition-all active:scale-95 touch-manipulation cursor-pointer flex flex-col"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    <div className="w-full aspect-square bg-white rounded-md flex items-center justify-center mb-1.5 sm:mb-2 shadow-sm border border-gray-200 overflow-hidden">
                      <img
                        src={product.images?.[0] || 'https://via.placeholder.com/100'}
                        alt={product.name}
                        className="w-full h-full object-contain p-1 sm:p-1.5"
                      />
                    </div>
                    <div className="w-full bg-gray-800 text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-1 sm:py-1.5 rounded-md text-center">
                      ETB{formatPrice(product.price || 0)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Festive Graphics Section */}
              <div className="relative bg-gradient-to-r from-red-500 via-orange-500 to-pink-500 rounded-md p-1.5 sm:p-2 flex-shrink-0 w-[115px] sm:w-[130px] md:w-[140px] overflow-hidden shadow-lg active:scale-95 transition-transform touch-manipulation">
                {/* Animated background gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-transparent to-purple-500/20 animate-pulse"></div>
                
                {/* Sparkle effects */}
                <div className="absolute top-1 left-2 w-1 h-1 bg-white rounded-full animate-ping"></div>
                <div className="absolute top-3 right-4 w-1 h-1 bg-yellow-300 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
                <div className="absolute bottom-2 left-1/3 w-1 h-1 bg-white rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
                
                <div className="relative z-10 flex flex-col h-full">
                  {/* Header with icon and text */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-0.5 sm:gap-1">
                      <div className="relative">
                        <span className="text-[10px] sm:text-xs">🎄</span>
                        <Sparkles className="absolute -top-1 -right-1 w-2 h-2 text-yellow-300 animate-pulse" />
                      </div>
                      <div className="text-[8px] sm:text-[9px] font-bold text-white leading-tight drop-shadow-md">Flash Sale</div>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <span className="text-[9px] sm:text-[10px] animate-bounce" style={{animationDelay: '0s'}}>🎮</span>
                      <span className="text-[9px] sm:text-[10px] animate-bounce" style={{animationDelay: '0.3s'}}>🧸</span>
                    </div>
                  </div>
                  
                  {/* Decorative elements */}
                  <div className="flex items-center justify-center gap-1 mt-auto">
                    <Star className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-yellow-300 fill-yellow-300" />
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
                    <Star className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-yellow-300 fill-yellow-300" />
                  </div>
                </div>
                
                {/* Decorative background effects */}
                <div className="absolute right-0 bottom-0 opacity-30">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-700 rounded-full -mr-4 -mb-4 sm:-mr-5 sm:-mb-5 blur-sm"></div>
                </div>
                <div className="absolute left-0 top-0 opacity-20">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-300 rounded-full -ml-2 -mt-2 sm:-ml-3 sm:-mt-3 blur-sm"></div>
                </div>
                <div className="absolute top-1/2 right-2 opacity-25">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-pink-400 rounded-full blur-sm"></div>
                </div>
                
                {/* Animated border glow */}
                <div className="absolute inset-0 rounded-md border-2 border-white/30 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* More to love Section */}
          <div className="bg-white py-4">
            <div className="px-4 mb-3">
              <h2 className="text-gray-600 text-sm font-medium">More to love</h2>
            </div>
            <div className="grid grid-cols-2 gap-2 px-4">
              {featuredProducts.slice(0, 10).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* DESKTOP ONLY: AliExpress-inspired layout */}
      <div className="hidden md:block">
        <div className="bg-gradient-to-b from-[#fff4ef] via-white to-white pb-16">
          <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_260px] xl:grid-cols-[260px_minmax(0,1fr)_300px]">
              {/* Category list */}
              <aside className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Top categories</h2>
                  <p className="text-xs text-gray-500 mt-1">Explore popular picks from EcoExpress</p>
                </div>
                <ul className="divide-y divide-gray-100">
                  {categories.slice(0, 12).map((category, index) => (
                    <li key={index}>
                      <Link
                        to={`/shop?category=${encodeURIComponent(category.name)}`}
                        className="group flex items-center justify-between gap-4 px-6 py-3 hover:bg-[#fff5f0] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">
                            {category.icon || '📦'}
                          </span>
                          <span className="text-sm font-medium text-gray-700 group-hover:text-[#ff4747]">
                            {category.name}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#ff4747]" />
                      </Link>
                    </li>
                  ))}
                </ul>
                {categories.length > 12 && (
                  <Link
                    to="/shop"
                    className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-[#ff4747] bg-[#fff5f0] hover:bg-[#ffe2d2] transition-colors"
                  >
                    View all categories
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </aside>

              {/* Hero content */}
              <section className="space-y-4">
                <div className="relative bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="relative h-80 bg-gradient-to-br from-[#ff6a3c] to-[#ff2e2e]">
                    {currentBanner?.image && (
                      <img
                        src={currentBanner.image}
                        alt={currentBanner.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/35 to-transparent" />
                    <div className="relative h-full flex flex-col justify-between p-8 text-white">
                      <div>
                        <span className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-3 py-1 rounded-full text-xs uppercase tracking-[0.2em] mb-4">Mega sale</span>
                        <h2 className="text-3xl font-bold leading-snug max-w-xl">
                          {currentBanner?.title || 'Discover global deals every day'}
                        </h2>
                        <p className="mt-3 text-base text-white/80 max-w-lg">
                          {currentBanner?.subtitle || 'Shop millions of items with fast shipping and exclusive EcoExpress offers.'}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        {currentBanner?.cta && (
                          <Link
                            to={currentBanner.cta.to}
                            className="inline-flex items-center gap-2 bg-white text-[#ff4747] font-semibold px-6 py-3 rounded-full shadow-lg hover:bg-[#ffe2d2] transition-colors"
                          >
                            {currentBanner.cta.label}
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={() => navigate('/shop')}
                          className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm"
                        >
                          Explore all deals
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-3">
                      <button
                        type="button"
                        onClick={handleBannerPrev}
                        className="w-10 h-10 rounded-full bg-white/80 hover:bg-white text-gray-700 flex items-center justify-center shadow"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3">
                      <button
                        type="button"
                        onClick={handleBannerNext}
                        className="w-10 h-10 rounded-full bg-white/80 hover:bg-white text-gray-700 flex items-center justify-center shadow"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="absolute left-8 bottom-6 flex items-center gap-2">
                      {banners.map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setBannerIndex(index)}
                          className={`h-2 rounded-full transition-all ${bannerIndex === index ? 'w-8 bg-white' : 'w-2 bg-white/60 hover:bg-white/80'}`}
                          aria-label={`View banner ${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {superDeals.map((deal, index) => (
                    <Link
                      key={deal.id || index}
                      to={`/product/${deal.id}`}
                      className="group bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all"
                    >
                      <div className="relative aspect-[16/9] bg-gray-50 flex items-center justify-center">
                        <img
                          src={deal.image || 'https://via.placeholder.com/300'}
                          alt={deal.name}
                          className="w-full h-full object-cover"
                        />
                        {deal.timer && (
                          <div className="absolute top-4 left-4 bg-black/70 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-2">
                            <Timer className="w-3.5 h-3.5" />
                            <span>{deal.timer}</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4 space-y-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-[#ff4747]">{deal.title}</span>
                        <h3 className="text-base font-semibold text-gray-900 line-clamp-2">{deal.name}</h3>
                        {deal.subtitle && (
                          <p className="text-xs text-gray-500">{deal.subtitle}</p>
                        )}
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-lg font-bold text-[#ff4747]">ETB{formatPrice(deal.price || 0)}</span>
                          {deal.originalPrice && (
                            <span className="text-xs text-gray-400 line-through">ETB{formatPrice(deal.originalPrice)}</span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              {/* Right column */}
              <aside className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  {user ? (
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-400">My EcoExpress</p>
                        <h3 className="text-lg font-semibold text-gray-900 mt-2">Welcome back, {user.user_metadata?.name || user.email?.split('@')[0]}</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <Link to="/orders" className="bg-gray-50 rounded-xl px-4 py-3 hover:bg-[#fff5f0] transition-colors">Orders</Link>
                        <Link to="/wishlist" className="bg-gray-50 rounded-xl px-4 py-3 hover:bg-[#fff5f0] transition-colors">Wishlist</Link>
                        <Link to="/cart" className="bg-gray-50 rounded-xl px-4 py-3 hover:bg-[#fff5f0] transition-colors">Cart</Link>
                        <Link to="/profile" className="bg-gray-50 rounded-xl px-4 py-3 hover:bg-[#fff5f0] transition-colors">Account</Link>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-400">New to EcoExpress?</p>
                        <h3 className="text-lg font-semibold text-gray-900 mt-2">Sign in to unlock exclusive deals</h3>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Link
                          to="/login"
                          className="inline-flex items-center justify-center gap-2 bg-[#ff4747] text-white font-semibold px-6 py-3 rounded-full hover:bg-[#ff2e2e] transition-colors"
                        >
                          Sign in
                        </Link>
                        <Link
                          to="/signup"
                          className="inline-flex items-center justify-center gap-2 border border-[#ff4747] text-[#ff4747] font-semibold px-6 py-3 rounded-full hover:bg-[#fff5f0] transition-colors"
                        >
                          Create account
                        </Link>
                      </div>
                      <ul className="space-y-2 text-xs text-gray-500">
                        <li>• Fast checkout and order tracking</li>
                        <li>• Personalized recommendations</li>
                        <li>• Exclusive coupons and flash deals</li>
                      </ul>
                    </div>
                  )}
                </div>

                <div className="relative overflow-hidden rounded-2xl border border-[#ffd8c2] bg-[#fff3ec] p-6 shadow-inner">
                  <div className="absolute -right-6 -top-6 w-24 h-24 bg-[#ffb498]/50 rounded-full blur-2xl" />
                  <h3 className="text-lg font-semibold text-gray-900">Collect coupons daily</h3>
                  <p className="text-sm text-gray-600 mt-2">Claim extra savings on top of already low prices.</p>
                  <button type="button" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#ff4747] hover:text-[#ff2e2e]">
                    Get coupons
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <Shield className="w-6 h-6 text-[#ff4747]" />
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">Buyer Protection</h4>
                      <p className="text-xs text-gray-500 mt-1">Get full refunds if your order doesn’t arrive or isn’t as described.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Truck className="w-6 h-6 text-[#ff4747]" />
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">Fast delivery</h4>
                      <p className="text-xs text-gray-500 mt-1">Enjoy reliable shipping options on thousands of items.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Heart className="w-6 h-6 text-[#ff4747]" />
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">Choice guarantee</h4>
                      <p className="text-xs text-gray-500 mt-1">Exclusive deals curated for you every day.</p>
                    </div>
                  </div>
                </div>
              </aside>
            </div>

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

            {/* Popular categories */}
            <section className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Popular categories</h2>
                <Link to="/shop" className="text-sm font-semibold text-[#ff4747] hover:text-[#ff2e2e] flex items-center gap-1">
                  Shop all
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {categories.slice(0, 12).map((category, index) => (
                  <Link
                    key={index}
                    to={`/shop?category=${encodeURIComponent(category.name)}`}
                    className="group bg-[#fff8f4] hover:bg-[#ffe7d8] border border-transparent hover:border-[#ffd0b3] rounded-2xl px-4 py-6 text-center transition-all"
                  >
                    <div className="text-3xl mb-3">{category.icon || '📦'}</div>
                    <div className="text-sm font-semibold text-gray-700 group-hover:text-[#ff4747]">{category.name}</div>
                  </Link>
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

