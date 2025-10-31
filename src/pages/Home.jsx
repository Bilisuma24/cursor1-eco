import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { 
  Search, 
  Star, 
  Truck, 
  Shield, 
  Award,
  TrendingUp,
  Users,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Zap,
  Heart
} from "lucide-react";
import { useCart } from "../contexts/CartContext";
import ProductCard from "../components/ProductCard";
import productsData from "../data/products.js";
import { supabase } from "../lib/supabaseClient";

export default function Home() {
  const { getCartItemsCount } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [bannerIndex, setBannerIndex] = useState(0);
  const [isVisible, setIsVisible] = useState({});
  const bannerTimer = useRef(null);
  const observerRef = useRef(null);

  // Fetch products from database and combine with static products
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      // Fetch products from database (seller-added products)
      const { data: dbProducts, error: dbError } = await supabase
        .from('product')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) {
        console.error('Error fetching products from database:', dbError);
      }

      // Transform database products to match ProductCard format
      const transformedDbProducts = (dbProducts || []).map(product => ({
        id: product.id,
        name: product.name || 'Untitled Product',
        description: product.description || '',
        price: parseFloat(product.price) || 0,
        images: product.image_url 
          ? (Array.isArray(product.image_url) ? product.image_url : [product.image_url])
          : (product.images && Array.isArray(product.images) ? product.images : ['https://via.placeholder.com/400']),
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
        isFromDatabase: true,
      }));

      // Combine database products with static products
      const staticProducts = productsData.products || [];
      const combinedProducts = [...transformedDbProducts, ...staticProducts];
      
      // Remove duplicates based on ID (database products first)
      const allProducts = combinedProducts.reduce((acc, product) => {
        if (!acc.find(p => p.id === product.id)) {
          acc.push(product);
        }
        return acc;
      }, []);

      // Get featured products (high rating, good sales)
      const featured = allProducts
        .filter(p => (p.rating || 0) >= 4.0 && (p.sold || 0) > 0)
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 8);
      setFeaturedProducts(featured);

      // Get trending products (recent sales or newest)
      const trending = allProducts
        .sort((a, b) => (b.sold || 0) - (a.sold || 0))
        .slice(0, 6);
      setTrendingProducts(trending);
    } catch (error) {
      console.error('Error fetching products:', error);
      // Fallback to static products on error
      const featured = productsData.products
        .filter(p => p.rating >= 4.5 && p.sold > 1000)
        .slice(0, 8);
      setFeaturedProducts(featured);

      const trending = productsData.products
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 6);
      setTrendingProducts(trending);
    }
  };

  const categories = [
    { name: "Electronics", icon: "📱", count: "12,345 products" },
    { name: "Fashion", icon: "👗", count: "8,765 products" },
    { name: "Home & Garden", icon: "🏠", count: "5,432 products" },
    { name: "Sports", icon: "⚽", count: "3,210 products" },
    { name: "Beauty", icon: "💄", count: "2,876 products" },
    { name: "Automotive", icon: "🚗", count: "1,543 products" }
  ];

  const features = [
    {
      icon: <Truck className="w-6 h-6" />,
      title: "Free Shipping",
      description: "On orders over $50"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure Payment",
      description: "100% secure transactions"
    },
    {
      icon: <Award className="w-6 h-6" />,
      title: "Quality Guarantee",
      description: "30-day return policy"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "24/7 Support",
      description: "Customer service always available"
    }
  ];

  const banners = [
    {
      title: "Global Shopping Festival",
      subtitle: "Up to 60% off electronics",
      image: productsData.products[1]?.images?.[0],
      cta: { label: "Shop Electronics", to: "/shop?category=Electronics" }
    },
    {
      title: "Fashion Week Deals",
      subtitle: "Trending styles and accessories",
      image: productsData.products[4]?.images?.[0],
      cta: { label: "Shop Fashion", to: "/shop?category=Fashion" }
    },
    {
      title: "Home & Garden Savings",
      subtitle: "Everything for your space",
      image: productsData.products[9]?.images?.[0],
      cta: { label: "Shop Home", to: "/shop?category=Home%20%26%20Garden" }
    }
  ];

  useEffect(() => {
    bannerTimer.current = setInterval(() => {
      setBannerIndex((i) => (i + 1) % banners.length);
    }, 5000);
    return () => bannerTimer.current && clearInterval(bannerTimer.current);
  }, []);

  // Scroll animation observer
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const elements = document.querySelectorAll('[data-animate]');
    elements.forEach((el) => observerRef.current.observe(el));

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with left categories and banner carousel */}
      <div className="bg-gradient-to-br from-orange-50 via-orange-100 to-yellow-50 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -left-10 w-20 h-20 bg-orange-200 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute top-20 right-10 w-16 h-16 bg-yellow-200 rounded-full opacity-30 animate-bounce"></div>
          <div className="absolute bottom-10 left-1/4 w-12 h-12 bg-orange-300 rounded-full opacity-25 animate-ping"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-6 relative z-10">
          {/* Left Categories */}
          <div 
            className="hidden lg:block lg:col-span-1"
            data-animate
            id="categories"
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-xl border border-gray-200 overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105">
              <div className="px-4 py-3 font-semibold text-gray-800 border-b bg-gradient-to-r from-orange-500 to-yellow-500 text-white">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5" />
                  <span>Categories</span>
                </div>
              </div>
              <ul className="divide-y">
                {productsData.categories.map((cat, index) => (
                  <li 
                    key={cat.id}
                    className="group"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <Link 
                      to={`/shop?category=${encodeURIComponent(cat.name)}`} 
                      className="flex items-center justify-between px-4 py-3 text-sm hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 transition-all duration-300 group-hover:translate-x-2"
                    >
                      <span className="group-hover:text-orange-600 transition-colors duration-300">{cat.name}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all duration-300" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Banner Carousel */}
          <div 
            className="lg:col-span-3 relative"
            data-animate
            id="banner"
          >
            <div className="relative overflow-hidden rounded-xl h-64 md:h-80 shadow-2xl">
              {banners.map((b, i) => (
                <div 
                  key={i} 
                  className={`absolute inset-0 transition-all duration-1000 transform ${
                    i === bannerIndex 
                      ? 'opacity-100 scale-100 translate-x-0' 
                      : 'opacity-0 scale-105 translate-x-4'
                  }`}
                >
                  <img 
                    src={b.image} 
                    alt={b.title} 
                    className="w-full h-full object-cover transition-transform duration-1000 hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent" />
                  <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-center text-white">
                    <div className="transform transition-all duration-1000 delay-300">
                      <h2 className="text-2xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-white to-yellow-200 bg-clip-text text-transparent">
                        {b.title}
                      </h2>
                      <p className="text-sm md:text-lg text-white/90 mb-6 max-w-md">{b.subtitle}</p>
                      <Link 
                        to={b.cta.to} 
                        className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white px-6 py-3 rounded-lg text-sm font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                      >
                        <Zap className="w-4 h-4" />
                        <span>{b.cta.label}</span>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Controls */}
            <button onClick={() => setBannerIndex((bannerIndex - 1 + banners.length) % banners.length)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white w-10 h-10 rounded-full flex items-center justify-center"><ChevronLeft className="w-5 h-5" /></button>
            <button onClick={() => setBannerIndex((bannerIndex + 1) % banners.length)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white w-10 h-10 rounded-full flex items-center justify-center"><ChevronRight className="w-5 h-5" /></button>
            {/* Dots */}
            <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-2">
              {banners.map((_, i) => (
                <button key={i} onClick={() => setBannerIndex(i)} className={`w-2.5 h-2.5 rounded-full ${i === bannerIndex ? 'bg-white' : 'bg-white/60'}`} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="bg-gradient-to-b from-white to-gray-50 py-20 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-100 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-purple-100 rounded-full opacity-30 animate-bounce"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div 
            className="text-center mb-16"
            data-animate
            id="categories-title"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              Shop by Category
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Find exactly what you're looking for with our comprehensive product categories
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {categories.map((category, index) => (
              <Link
                key={index}
                to="/shop"
                data-animate
                id={`category-${index}`}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 p-8 text-center group border border-gray-100 hover:border-blue-200 transform hover:-translate-y-3 hover:rotate-1 relative overflow-hidden"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Hover effect background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  <div className="text-6xl mb-4 group-hover:scale-125 transition-transform duration-500 group-hover:rotate-12">
                    {category.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
                  {category.name}
                </h3>
                  <p className="text-sm text-gray-500 font-medium group-hover:text-gray-700 transition-colors duration-300">
                    {category.count}
                  </p>
                  <div className="mt-4 w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 transform scale-x-0 group-hover:scale-x-100"></div>
                </div>
                
                {/* Sparkle effect */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div className="bg-gradient-to-b from-gray-50 to-white py-20 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 right-10 w-40 h-40 bg-orange-100 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute bottom-10 left-10 w-28 h-28 bg-yellow-100 rounded-full opacity-30 animate-bounce"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div 
            className="text-center mb-16"
            data-animate
            id="featured-title"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-gray-900 via-orange-600 to-red-600 bg-clip-text text-transparent">
              Featured Products
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
              Handpicked products with excellent ratings and unbeatable value
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <span>View All Products</span>
              <TrendingUp className="w-5 h-5" />
            </Link>
          </div>

          <div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
            data-animate
            id="featured-products"
          >
            {featuredProducts.map((product, index) => (
              <div
                key={product.id}
                style={{ animationDelay: `${index * 100}ms` }}
                className="transform transition-all duration-500 hover:scale-105"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trending Products */}
      <div className="bg-gradient-to-b from-white to-gray-50 py-20 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-36 h-36 bg-green-100 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-blue-100 rounded-full opacity-30 animate-bounce"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div 
            className="text-center mb-16"
            data-animate
            id="trending-title"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-gray-900 via-green-600 to-blue-600 bg-clip-text text-transparent">
              Trending Now
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed">
              Discover what's popular and trending among our customers
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <span>Explore Trending</span>
              <TrendingUp className="w-5 h-5" />
            </Link>
          </div>

          <div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            data-animate
            id="trending-products"
          >
            {trendingProducts.map((product, index) => (
              <div
                key={product.id}
                style={{ animationDelay: `${index * 150}ms` }}
                className="transform transition-all duration-500 hover:scale-105"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 py-20 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-32 h-32 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-28 h-28 bg-purple-200 rounded-full opacity-30 animate-bounce"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full opacity-10 animate-ping"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div 
            className="text-center mb-16"
            data-animate
            id="features-title"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-gray-900 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Why Choose Us?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              We're committed to providing the best shopping experience with unmatched service and quality
            </p>
          </div>

          <div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            data-animate
            id="features"
          >
            {features.map((feature, index) => (
              <div 
                key={index} 
                data-animate
                id={`feature-${index}`}
                className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 hover:rotate-1 border border-gray-100 relative overflow-hidden group"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                {/* Hover effect background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  <div className="bg-gradient-to-br from-blue-500 to-purple-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
                  {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                    {feature.description}
                  </p>
                  
                  {/* Sparkle effect */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <Heart className="w-4 h-4 text-red-400 animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-purple-800 text-white py-20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">Trusted by Millions Worldwide</h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">Join our growing community of satisfied customers</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="text-5xl font-bold mb-3 text-yellow-300">1M+</div>
              <div className="text-blue-100 text-lg font-medium">Happy Customers</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="text-5xl font-bold mb-3 text-yellow-300">50K+</div>
              <div className="text-blue-100 text-lg font-medium">Products</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="text-5xl font-bold mb-3 text-yellow-300">99.9%</div>
              <div className="text-blue-100 text-lg font-medium">Uptime</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="text-5xl font-bold mb-3 text-yellow-300">24/7</div>
              <div className="text-blue-100 text-lg font-medium">Support</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
