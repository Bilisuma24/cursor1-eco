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
import productsData from "../data/products.json";

export default function Home() {
  const { getCartItemsCount } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

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
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold mb-6">
                Discover Amazing Products
                <span className="block text-yellow-300">at Unbeatable Prices</span>
              </h1>
              <p className="text-xl text-blue-100 mb-8">
                Shop from millions of products with fast shipping, secure payments, and excellent customer service.
              </p>
              
              {/* Search Bar */}
              <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search for products, brands, and more..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 text-gray-900 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                />
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-yellow-400 text-gray-900 px-6 py-2 rounded-md font-medium hover:bg-yellow-300 transition-colors duration-200">
                  Search
                </button>
              </div>

              <div className="flex space-x-4">
                <Link
                  to="/shop"
                  className="bg-yellow-400 text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors duration-200"
                >
                  Shop Now
                </Link>
                <Link
                  to="/about"
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors duration-200"
                >
                  Learn More
                </Link>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
                <div className="grid grid-cols-2 gap-4">
                  {productsData.products.slice(0, 4).map((product, index) => (
                    <div key={product.id} className="bg-white rounded-lg p-4 shadow-lg">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-24 object-cover rounded mb-2"
                      />
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="flex items-center space-x-1 mt-1">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="text-lg font-bold text-red-600 mt-1">
                        ${product.price}
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
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Shop by Category</h2>
          <p className="text-gray-600">Find exactly what you're looking for</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((category, index) => (
            <Link
              key={index}
              to="/shop"
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 p-6 text-center group"
            >
              <div className="text-4xl mb-3">{category.icon}</div>
              <h3 className="font-medium text-gray-900 mb-1 group-hover:text-blue-600 transition-colors duration-200">
                {category.name}
              </h3>
              <p className="text-sm text-gray-500">{category.count}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Products */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Products</h2>
              <p className="text-gray-600">Handpicked products with excellent ratings</p>
            </div>
            <Link
              to="/shop"
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
            >
              <span>View All</span>
              <TrendingUp className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>

      {/* Trending Products */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Trending Now</h2>
              <p className="text-gray-600">What's popular right now</p>
            </div>
            <Link
              to="/shop"
              className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
            >
              <span>View All</span>
              <TrendingUp className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Us?</h2>
            <p className="text-gray-600">We're committed to providing the best shopping experience</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">1M+</div>
              <div className="text-blue-100">Happy Customers</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50K+</div>
              <div className="text-blue-100">Products</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-blue-100">Uptime</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Support</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
