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
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-[140px_minmax(0,1fr)_220px] xl:grid-cols-[150px_minmax(0,1fr)_240px]">
              {/* Category list */}
              <aside className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden text-sm transform scale-[0.85] origin-top-left">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h2 className="text-base font-semibold text-gray-900">Top categories</h2>
                  <p className="text-[11px] text-gray-500 mt-1 leading-snug">Explore popular picks from EcoExpress</p>
                </div>
                <ul className="divide-y divide-gray-100">
                  {categories.slice(0, 12).map((category, index) => (
                    <li key={index}>
                      <Link
                        to={`/shop?category=${encodeURIComponent(category.name)}`}
                        className="group flex items-center justify-between gap-2.5 px-4 py-2 hover:bg-[#fff5f0] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">
                            {category.icon || '📦'}
                          </span>
                          <span className="text-[13px] font-medium text-gray-700 group-hover:text-[#ff4747] truncate max-w-[110px]">
                            {category.name}
                          </span>
                        </div>
                        <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-[#ff4747]" />
                      </Link>
                    </li>
                  ))}
                </ul>
                {categories.length > 12 && (
                  <Link
                    to="/shop"
                    className="flex items-center justify-center gap-2 px-4 py-2 text-[13px] font-semibold text-[#ff4747] bg-[#fff5f0] hover:bg-[#ffe2d2] transition-colors"
                  >
                    View all categories
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
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

