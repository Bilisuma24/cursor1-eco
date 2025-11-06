import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Star, ShoppingCart, User, Grid, TrendingUp, Truck, Shield, Award, Users, ChevronRight, ChevronLeft, Sparkles, Zap, Heart, Timer, Copy, Menu, ChevronDown } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import ProductCard from "../components/ProductCard";
import productsData from "../data/products.js";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const { getCartItemsCount } = useCart();
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
  const topDealProducts = trendingProducts.slice(0, 3);

  // Categories for desktop
  const categories = productsData.categories || [];

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

      {/* DESKTOP ONLY: Clean Professional Layout */}
      <div className="hidden md:block">
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
          {/* Category Navigation Bar */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-6 py-3">
              <div className="flex items-center gap-6">
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded">
                  <Menu className="w-5 h-5" />
                  <span>All Categories</span>
                </button>
                <Link to="/shop" className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded">
                  Choice
                </Link>
                <Link to="/shop" className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded">
                  SuperDeals
                </Link>
                <Link to="/shop" className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded">
                  AliExpress Business
                </Link>
                <Link to="/shop" className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded">
                  Home Improvement & Lighting
                </Link>
                <button className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded">
                  <span>More</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Promotional Section with Discount Codes */}
          <div className="bg-orange-200 border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
              {/* Sale Timer Header - Single Line */}
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <span className="text-base md:text-lg font-bold text-gray-900 flex-shrink-0">Super Deal</span>
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-2.5 md:px-3 py-1 rounded-full font-bold shadow-md flex-shrink-0">
                  <span className="text-xs md:text-sm">Up to 70% off</span>
                  <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </div>
              </div>

              {/* Horizontal Layout: Top Deal Products | Product | Festive Graphic */}
              <div className="flex gap-3 md:gap-4 pb-2">
                {/* Top Deal Product Boxes - Horizontal Row */}
                <div className="flex gap-3 md:gap-4 w-full">
                  {topDealProducts.map((product, index) => (
                    <div
                      key={product.id || index}
                      className="bg-gradient-to-br from-white to-pink-50 border-2 border-dashed border-pink-400 rounded-md p-3 md:p-4 flex-1 shadow-sm hover:shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95 touch-manipulation flex flex-col"
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      <div className="w-full aspect-square bg-white rounded-md flex items-center justify-center mb-2.5 shadow-sm border border-gray-200 overflow-hidden">
                        <img
                          src={product.images?.[0] || 'https://via.placeholder.com/150'}
                          alt={product.name}
                          className="w-full h-full object-contain p-2 md:p-2.5"
                        />
                      </div>
                      <div className="w-full bg-gray-800 text-white text-xs md:text-sm font-bold px-3 md:px-4 py-2 md:py-2.5 rounded-md text-center">
                        ETB{formatPrice(product.price || 0)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Festive Graphics Section */}
                <div className="relative bg-gradient-to-r from-red-500 via-orange-500 to-pink-500 rounded-md p-2.5 md:p-3 flex-shrink-0 w-[130px] md:w-[150px] lg:w-[170px] overflow-hidden shadow-lg hover:shadow-xl transition-shadow active:scale-95 touch-manipulation">
                  {/* Animated background gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-transparent to-purple-500/20 animate-pulse"></div>
                  
                  {/* Sparkle effects */}
                  <div className="absolute top-2 left-3 w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
                  <div className="absolute top-4 right-6 w-1.5 h-1.5 bg-yellow-300 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
                  <div className="absolute bottom-3 left-1/3 w-1.5 h-1.5 bg-white rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
                  <div className="absolute top-1/2 right-3 w-1 h-1 bg-yellow-200 rounded-full animate-ping" style={{animationDelay: '1.5s'}}></div>
                  
                  <div className="relative z-10 flex flex-col h-full">
                    {/* Header with icon and text */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <div className="relative">
                          <span className="text-sm md:text-base">🎄</span>
                          <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-yellow-300 animate-pulse" />
                        </div>
                        <div className="text-xs md:text-sm font-bold text-white drop-shadow-md">Flash Sale</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs md:text-sm animate-bounce" style={{animationDelay: '0s'}}>🎮</span>
                        <span className="text-xs md:text-sm animate-bounce" style={{animationDelay: '0.3s'}}>🧸</span>
                      </div>
                    </div>
                    
                    {/* Decorative elements */}
                    <div className="flex items-center justify-center gap-2 mt-auto">
                      <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-300 fill-yellow-300" />
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
                      <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-300 fill-yellow-300" />
                    </div>
                  </div>
                  
                  {/* Decorative background effects */}
                  <div className="absolute right-0 bottom-0 opacity-30">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-red-700 rounded-full -mr-6 -mb-6 md:-mr-8 md:-mb-8 blur-sm"></div>
                  </div>
                  <div className="absolute left-0 top-0 opacity-20">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-300 rounded-full -ml-4 -mt-4 md:-ml-5 md:-mt-5 blur-sm"></div>
                  </div>
                  <div className="absolute top-1/2 right-3 opacity-25">
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-pink-400 rounded-full blur-sm"></div>
                  </div>
                  
                  {/* Animated border glow */}
                  <div className="absolute inset-0 rounded-md border-2 border-white/30 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Deals Section */}
          <div className="bg-white py-6 shadow-sm">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-gray-900">Today's Deals</h2>
                <Link to="/shop" className="text-sm text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1">
                  View All <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {trendingProducts.slice(0, 6).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </div>

          {/* Categories Section */}
          <div className="bg-white py-4 border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Shop by Category</h2>
              <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
                {categories.map((category, index) => (
                  <Link
                    key={index}
                    to="/shop"
                    className="bg-gray-50 rounded-lg border border-gray-200 p-3 text-center hover:border-orange-500 hover:bg-orange-50 hover:shadow-md transition-all duration-200"
                  >
                    <div className="text-2xl mb-1.5">{category.icon || '📦'}</div>
                    <div className="text-xs text-gray-900 font-medium">{category.name}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Featured Products */}
          <div className="bg-gray-50 py-6 border-t border-gray-100">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-bold text-gray-900">Featured Products</h2>
                <Link to="/shop" className="text-sm text-orange-500 hover:text-orange-600 font-medium flex items-center gap-1">
                  View All <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {featuredProducts.slice(0, 12).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

