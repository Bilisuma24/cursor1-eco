import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Search, 
  ShoppingCart, 
  Heart, 
  Star, 
  Truck, 
  Shield, 
  Award,
  TrendingUp,
  Clock,
  Users
} from "lucide-react";
import { useCart } from "../contexts/CartContext";
import ProductCard from "../components/ProductCard";
import productsData from "../data/products.js";

export default function Home() {
  const { getCartItemsCount } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-purple-800 text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat'
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-6xl font-bold leading-tight">
                  Discover Amazing Products
                  <span className="block text-yellow-300 mt-2">at Unbeatable Prices</span>
                </h1>
                <p className="text-xl text-blue-100 leading-relaxed max-w-lg">
                  Shop from millions of products with fast shipping, secure payments, and excellent customer service. Join over 1 million satisfied customers worldwide.
                </p>
              </div>
              
              {/* Search Bar */}
              <div className="relative max-w-2xl">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
                <input
                  type="text"
                  placeholder="Search for products, brands, and more..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-14 pr-32 py-4 text-gray-900 rounded-xl focus:ring-4 focus:ring-yellow-400/50 focus:outline-none shadow-2xl text-lg"
                />
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-yellow-400 text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-all duration-200 shadow-lg">
                  Search
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/shop"
                  className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-yellow-300 transition-all duration-200 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1"
                >
                  Shop Now
                </Link>
                <Link
                  to="/about"
                  className="border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 hover:border-white/50 transition-all duration-200 backdrop-blur-sm"
                >
                  Learn More
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center space-x-8 pt-4">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-yellow-300" />
                  <span className="text-sm font-medium">Secure Payment</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Truck className="w-5 h-5 text-yellow-300" />
                  <span className="text-sm font-medium">Free Shipping</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-yellow-300" />
                  <span className="text-sm font-medium">Quality Guarantee</span>
                </div>
              </div>
            </div>

            {/* Hero Product Showcase */}
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20">
                <div className="grid grid-cols-2 gap-6">
                  {productsData.products.slice(0, 4).map((product, index) => (
                    <div key={product.id} className="bg-white rounded-2xl p-4 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                      <div className="aspect-square mb-3 overflow-hidden rounded-xl">
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2">
                        {product.name}
                      </h3>
                      <div className="flex items-center space-x-1 mb-2">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="text-xs text-gray-600 ml-1">{product.rating}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-red-600">
                          {formatPrice(product.price)}
                        </div>
                        {product.discount && (
                          <div className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-bold">
                            -{product.discount}%
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
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
              className="inline-flex items-center space-x-2 bg-red-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
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
