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
  ChevronLeft
} from "lucide-react";
import { useCart } from "../contexts/CartContext";
import ProductCard from "../components/ProductCard";
import ColorImageDemo from "../components/ColorImageDemo";
import productsData from "../data/products.js";

export default function Home() {
  const { getCartItemsCount } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [bannerIndex, setBannerIndex] = useState(0);
  const bannerTimer = useRef(null);

  useEffect(() => {
    // Get featured products (high rating, good sales)
    const featured = productsData.products
      .filter(p => p.rating >= 4.5 && p.sold > 1000)
      .slice(0, 8);
    setFeaturedProducts(featured);

    // Get trending products (recent sales)
    const trending = productsData.products
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 6);
    setTrendingProducts(trending);
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section with left categories and banner carousel */}
      <div className="bg-orange-50">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Categories */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 font-semibold text-gray-800 border-b">Categories</div>
              <ul className="divide-y">
                {productsData.categories.map((cat) => (
                  <li key={cat.id}>
                    <Link to={`/shop?category=${encodeURIComponent(cat.name)}`} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50">
                      <span>{cat.name}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Banner Carousel */}
          <div className="lg:col-span-3 relative">
            <div className="relative overflow-hidden rounded-xl h-64 md:h-80">
              {banners.map((b, i) => (
                <div key={i} className={`absolute inset-0 transition-opacity duration-700 ${i === bannerIndex ? 'opacity-100' : 'opacity-0'}`}>
                  <img src={b.image} alt={b.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30" />
                  <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-center text-white">
                    <h2 className="text-2xl md:text-4xl font-bold mb-2">{b.title}</h2>
                    <p className="text-sm md:text-lg text-white/90 mb-4">{b.subtitle}</p>
                    <Link to={b.cta.to} className="w-max bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-md text-sm font-medium">{b.cta.label}</Link>
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
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Shop by Category</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Find exactly what you're looking for with our comprehensive product categories</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {categories.map((category, index) => (
              <Link
                key={index}
                to="/shop"
                className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-center group border border-gray-100 hover:border-blue-200 transform hover:-translate-y-2"
              >
                <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">{category.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-200">
                  {category.name}
                </h3>
                <p className="text-sm text-gray-500 font-medium">{category.count}</p>
                <div className="mt-4 w-12 h-1 bg-blue-600 mx-auto rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Products */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Featured Products</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">Handpicked products with excellent ratings and unbeatable value</p>
            <Link
              to="/shop"
              className="text-orange-600 hover:text-orange-700 font-medium flex items-center space-x-1"
            >
              <span>View All Products</span>
              <TrendingUp className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>

      {/* Trending Products */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Trending Now</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">Discover what's popular and trending among our customers</p>
            <Link
              to="/shop"
              className="text-orange-600 hover:text-orange-700 font-medium flex items-center space-x-1"
            >
              <span>Explore Trending</span>
              <TrendingUp className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {trendingProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Why Choose Us?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">We're committed to providing the best shopping experience with unmatched service and quality</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white shadow-lg">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Color Image Demo Section */}
      <div className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Color-Based Image Selection</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience our new feature that shows different product images based on selected colors
            </p>
          </div>
          <ColorImageDemo />
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
