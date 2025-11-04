import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Star, ShoppingCart, User, Grid, TrendingUp, Truck, Shield, Award, Users, ChevronRight, ChevronLeft, Sparkles, Zap, Heart, Timer, Copy } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import ProductCard from "../components/ProductCard";
import productsData from "../data/products.js";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const { getCartItemsCount } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [bannerIndex, setBannerIndex] = useState(0);
  const bannerTimer = useRef(null);

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
      setBannerIndex((i) => (i + 1) % 3);
    }, 5000);
    return () => bannerTimer.current && clearInterval(bannerTimer.current);
  }, []);

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
    },
    {
      title: "Home & Garden Savings",
      subtitle: "Everything for your space",
      image: productsData.products?.[9]?.images?.[0],
      cta: { label: "Shop Home", to: "/shop?category=Home%20%26%20Garden" }
    }
  ];

  // Categories for desktop
  const categories = productsData.categories || [];

  return (
    <div className="min-h-screen bg-white">
      {/* MOBILE ONLY: AliExpress-style Layout */}
      <div className="md:hidden">
        <div className="bg-white pb-20">
          {/* Top Browser Bar */}
          <div className="bg-gray-800 text-white text-xs py-1 px-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-600 rounded"></div>
              <span className="text-gray-300">ecostore.com</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-600 rounded"></div>
              <div className="w-6 h-4 bg-gray-600 rounded text-xs flex items-center justify-center">15</div>
              <div className="w-4 h-4 bg-gray-600 rounded"></div>
            </div>
          </div>

          {/* Header */}
          <div className="bg-white border-b border-gray-200">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-gray-900">Eco</span>
                <span className="text-xl font-bold text-orange-500">Store</span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-700">
                <span className="text-xs">📍</span>
                <span>Deliver to Ethiopia</span>
              </div>
            </div>
          </div>

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

          {/* Icon Row */}
          <div className="bg-white px-4 py-4 border-b border-gray-200">
            <div className="flex justify-around">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mb-1">
                  <Star className="w-6 h-6 text-yellow-400 fill-current" />
                </div>
                <span className="text-xs text-gray-700">Coins</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mb-1">
                  <span className="text-white text-lg">⚡</span>
                </div>
                <span className="text-xs text-gray-700">Super Deals</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-1">
                  <span className="text-white text-lg">🌳</span>
                </div>
                <span className="text-xs text-gray-700">Prize Land</span>
              </div>
            </div>
          </div>

          {/* Categories Section - Mobile */}
          <div className="bg-white px-4 py-4 border-b border-gray-200">
            <div className="mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Categories</h2>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {categories.slice(0, 8).map((category, index) => (
                <Link
                  key={index}
                  to={`/shop?category=${encodeURIComponent(category.name)}`}
                  className="flex flex-col items-center"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-1">
                    <span className="text-2xl">{category.icon || '📦'}</span>
                  </div>
                  <span className="text-xs text-gray-700 text-center line-clamp-2">{category.name}</span>
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

          {/* Main Banner - AliExpress Style */}
          <div className="bg-white px-4 py-4 border-b border-gray-200">
            <div className="relative rounded-xl overflow-hidden shadow-sm" style={{ height: '200px' }}>
              {banners.map((b, i) => (
                <div 
                  key={i} 
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    i === bannerIndex ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {/* Gradient Background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-400 via-gray-300 to-gray-100"></div>
                  
                  {/* Product Image - Right Side */}
                  {b.image && (
                    <div className="absolute right-0 bottom-0 w-32 h-32 flex items-end justify-end pr-4 pb-4">
                      <img
                        src={b.image}
                        alt={b.title}
                        className="w-full h-full object-contain drop-shadow-lg"
                      />
                    </div>
                  )}
                  
                  {/* Text Content - Left Side */}
                  <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-center pl-4 pr-24 z-10">
                    <h2 className="text-2xl font-bold text-white mb-2">{b.title}</h2>
                    <p className="text-sm text-white mb-4 opacity-95">{b.subtitle}</p>
                    <Link
                      to={b.cta.to}
                      className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-md transition-colors w-fit"
                    >
                      {b.cta.label}
                    </Link>
                  </div>
                </div>
              ))}
              
              {/* Carousel Indicators - Bottom Center */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 items-center z-20">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setBannerIndex(i)}
                    className="rounded-full transition-all"
                    style={{ 
                      width: i === bannerIndex ? '6px' : '4px',
                      height: i === bannerIndex ? '6px' : '4px',
                      backgroundColor: i === bannerIndex ? '#f97316' : '#ffffff'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Promotional Bar - AliExpress Style */}
          <div className="bg-orange-500 px-4 py-3">
            <div className="flex items-center justify-center gap-2 text-white text-sm">
              <span className="font-semibold">Flash Sale</span>
              <span className="w-1 h-1 bg-white rounded-full"></span>
              <span>Up to 70% OFF</span>
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

          {/* Bottom Navigation Bar */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
            <div className="flex justify-around py-2">
              <Link
                to="/"
                className="flex flex-col items-center gap-1"
              >
                <div className="w-6 h-6 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-red-500 rounded-sm flex items-center justify-center">
                    <div className="w-2 h-2 bg-red-500 rounded-sm"></div>
                  </div>
                </div>
                <span className="text-xs text-red-500 font-medium">Home</span>
              </Link>
              <Link
                to="/shop"
                className="flex flex-col items-center gap-1"
              >
                <Grid className="w-6 h-6 text-gray-600" />
                <span className="text-xs text-gray-600">Category</span>
              </Link>
              <Link
                to="/cart"
                className="flex flex-col items-center gap-1 relative"
              >
                <ShoppingCart className="w-6 h-6 text-gray-600" />
                {getCartItemsCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {getCartItemsCount()}
                  </span>
                )}
                <span className="text-xs text-gray-600">Cart</span>
              </Link>
              <Link
                to="/profile"
                className="flex flex-col items-center gap-1"
              >
                <User className="w-6 h-6 text-gray-600" />
                <span className="text-xs text-gray-600">Account</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* DESKTOP ONLY: Clean Professional Layout */}
      <div className="hidden md:block">
        <div className="min-h-screen bg-gray-50">
          {/* Hero Banner */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-6 py-6">
              <div className="relative h-96 overflow-hidden rounded-xl shadow-sm">
                {banners.map((b, i) => (
                  <div 
                    key={i} 
                    className={`absolute inset-0 transition-opacity duration-700 ${
                      i === bannerIndex ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <img 
                      src={b.image} 
                      alt={b.title} 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent"></div>
                    <div className="absolute bottom-8 left-8 text-white">
                      <h2 className="text-3xl font-bold mb-2">{b.title}</h2>
                      <p className="text-lg mb-4">{b.subtitle}</p>
                      <Link
                        to={b.cta.to}
                        className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                      >
                        {b.cta.label}
                      </Link>
                    </div>
                  </div>
                ))}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {banners.map((_, i) => (
                    <button 
                      key={i} 
                      onClick={() => setBannerIndex(i)} 
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === bannerIndex ? 'bg-orange-500' : 'bg-white/70'
                      }`} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Promotional Banner */}
          <div className="bg-orange-500 py-3">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex items-center justify-center gap-4 text-white text-base">
                <span className="font-semibold">Flash Sale</span>
                <span>•</span>
                <span>Up to 70% OFF</span>
              </div>
            </div>
          </div>

          {/* Today's Deals Section */}
          <div className="bg-white py-8">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Today's Deals</h2>
                <Link to="/shop" className="text-base text-orange-500 hover:text-orange-600 font-medium">View All →</Link>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {trendingProducts.slice(0, 6).map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </div>

          {/* Categories Section */}
          <div className="bg-gray-50 py-8 border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Shop by Category</h2>
              <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
                {categories.map((category, index) => (
                  <Link
                    key={index}
                    to="/shop"
                    className="bg-white rounded-lg border border-gray-200 p-6 text-center hover:border-orange-500 hover:shadow-md transition-all"
                  >
                    <div className="text-4xl mb-3">{category.icon || '📦'}</div>
                    <div className="text-sm text-gray-900 font-medium">{category.name}</div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Featured Products */}
          <div className="bg-white py-8 border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
                <Link to="/shop" className="text-base text-orange-500 hover:text-orange-600 font-medium">View All →</Link>
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
