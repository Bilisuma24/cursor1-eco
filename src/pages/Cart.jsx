import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight,
  Heart,
  Truck,
  Shield,
  CreditCard,
  CheckCircle,
  Sparkles
} from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/SupabaseAuthContext";
import { useCart as useSupabaseCart } from "../hooks/useCart";
import { supabase } from "../lib/supabaseClient";
import ProductCard from "../components/ProductCard";

export default function Cart() {
  const navigate = useNavigate();
  const { 
    cartItems, 
    updateQuantity, 
    removeFromCart, 
    clearCart, 
    getCartTotal, 
    getCartItemsCount,
    getCartItemsBySeller,
    addToWishlist
  } = useCart();
  
  // Use Supabase auth and cart hooks for Supabase integration
  const { user } = useAuth();
  const { checkout: supabaseCheckout } = useSupabaseCart(user?.id);

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState(null);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  const handleQuantityChange = (item, newQuantity) => {
    updateQuantity(item.id, item.selectedColor, item.selectedSize, newQuantity);
  };

  const handleRemoveItem = (item) => {
    removeFromCart(item.id, item.selectedColor, item.selectedSize);
  };

  const handleCheckout = async () => {
    if (!user) {
      setError('Please log in to checkout');
      // Redirect to login or show login modal
      navigate('/login');
      return;
    }

    setIsCheckingOut(true);
    setError(null);

    try {
      // Use Supabase checkout if user is logged in
      if (user) {
        await supabaseCheckout();
        alert('Order placed successfully!');
        clearCart();
        navigate('/orders');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  // Fetch recommended products
  useEffect(() => {
    if (cartItems.length === 0) {
      fetchRecommendedProducts();
    }
  }, [cartItems.length]);

  const fetchRecommendedProducts = async () => {
    try {
      setLoadingRecommendations(true);
      
      // Fetch latest products (or could use featured/trending)
      const { data: dbProducts, error: dbError } = await supabase
        .from('product')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8); // Get 8 products for recommendations

      if (dbError) {
        console.error('Error fetching recommended products:', dbError);
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
          return null;
        }
      };
      
      // Transform database products to match ProductCard format
      const transformedProducts = (dbProducts || []).map(product => {
        // Handle images
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
        
        // Convert image paths to public URLs
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
          .filter(img => img && img !== null && img !== undefined);
        
        return {
          id: product.id,
          name: product.name || 'Untitled Product',
          description: product.description || '',
          price: parseFloat(product.price) || 0,
          originalPrice: product.original_price ? parseFloat(product.original_price) : null,
          images: (() => {
            if (convertedImages.length > 0) {
              return convertedImages;
            }
            const svgPlaceholder = `data:image/svg+xml;base64,${btoa(`<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
              <rect width="400" height="400" fill="#f3f4f6"/>
              <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="18" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">No Image</text>
            </svg>`)}`;
            return [svgPlaceholder];
          })(),
          category: product.category || 'General',
          rating: product.rating || 4.0,
          reviews: product.reviews || Math.floor(Math.random() * 100),
          stock: product.stock || null,
          colors: product.colors || null,
          sizes: product.sizes || null,
          gender: product.gender || null,
          free_shipping: product.free_shipping || false,
          express_shipping: product.express_shipping || false,
          shipping_cost: product.shipping_cost || null,
        };
      });

      setRecommendedProducts(transformedProducts);
    } catch (err) {
      console.error('Error fetching recommended products:', err);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const cartItemsBySeller = getCartItemsBySeller();
  const subtotal = getCartTotal();
  const shipping = subtotal > 50 ? 0 : 9.99;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;
  const cartGridClass = "grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-8";

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 overflow-x-hidden">
        {/* RESPONSIVE FIX: Improved padding */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-8 sm:py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Left Column - Empty Cart Content */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 sm:p-12 overflow-hidden relative">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-red-50 to-transparent rounded-full blur-3xl opacity-50"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-yellow-50 to-transparent rounded-full blur-3xl opacity-50"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center space-x-3 mb-2">
                    <ShoppingBag className="w-8 h-8 text-purple-600" />
                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Shopping Cart
                    </h1>
                  </div>
                  <p className="text-gray-500 mb-8 flex items-center space-x-2">
                    <span>Start adding items to your cart</span>
                    <ArrowRight className="w-4 h-4 text-purple-500" />
                  </p>
                  
                  {/* Enhanced Empty Cart Illustration */}
                  <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                    <div className="relative mb-8 animate-bounce-slow">
                      {/* Ultra Modern 3D-style Cart Illustration */}
                      <div className="relative w-80 h-80 mx-auto">
                        {/* Floating decorative elements */}
                        <div className="absolute -left-4 top-12 animate-pulse" style={{ animationDelay: '0.5s' }}>
                          <svg width="40" height="40" viewBox="0 0 40 40">
                            <circle cx="20" cy="20" r="18" fill="#FCD34D" opacity="0.3" />
                            <circle cx="20" cy="20" r="12" fill="#FCD34D" opacity="0.5" />
                            <circle cx="20" cy="20" r="6" fill="#FCD34D" />
                          </svg>
                        </div>
                        <div className="absolute -right-8 bottom-16 animate-pulse" style={{ animationDelay: '1s' }}>
                          <svg width="32" height="32" viewBox="0 0 32 32">
                            <path d="M16 4 L20 12 L28 14 L22 20 L23 28 L16 24 L9 28 L10 20 L4 14 L12 12 Z" fill="#EC4899" opacity="0.4" />
                          </svg>
                        </div>

                        {/* Premium Shopping Basket with 3D depth */}
                        <div className="absolute inset-x-0 bottom-0 transform transition-transform duration-300 hover:scale-105">
                          <svg width="200" height="200" viewBox="0 0 200 200" className="mx-auto drop-shadow-2xl">
                            <defs>
                              <linearGradient id="cartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#FEE2E2" />
                                <stop offset="50%" stopColor="#EF4444" />
                                <stop offset="100%" stopColor="#DC2626" />
                              </linearGradient>
                              <linearGradient id="cartHandle" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#DC2626" />
                                <stop offset="100%" stopColor="#B91C1C" />
                              </linearGradient>
                              <filter id="shadow">
                                <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.3"/>
                              </filter>
                            </defs>
                            
                            {/* Multiple shadow layers for depth */}
                            <ellipse cx="100" cy="165" rx="70" ry="10" fill="#000000" opacity="0.15" />
                            <ellipse cx="100" cy="162" rx="65" ry="8" fill="#000000" opacity="0.1" />
                            
                            {/* Main cart body with gradient */}
                            <rect x="40" y="55" width="120" height="95" rx="10" fill="url(#cartGradient)" stroke="#B91C1C" strokeWidth="2.5" filter="url(#shadow)" />
                            
                            {/* Cart inner depth with perspective */}
                            <path d="M45 60 L155 60 L150 140 L50 140 Z" fill="#F87171" opacity="0.4" />
                            <rect x="50" y="65" width="105" height="70" rx="6" fill="#FCA5A5" opacity="0.2" />
                            
                            {/* Premium handle with gradient and shine */}
                            <path
                              d="M25 55 Q25 32 42 32 L60 32"
                              fill="none"
                              stroke="url(#cartHandle)"
                              strokeWidth="6"
                              strokeLinecap="round"
                              filter="url(#shadow)"
                            />
                            <path
                              d="M28 55 Q28 38 42 38 L56 38"
                              fill="none"
                              stroke="#FEE2E2"
                              strokeWidth="2"
                              strokeLinecap="round"
                              opacity="0.6"
                            />
                            
                            {/* Enhanced wheels with rim details */}
                            <g filter="url(#shadow)">
                              {/* Left wheel */}
                              <circle cx="60" cy="160" r="14" fill="#1F2937" />
                              <circle cx="60" cy="160" r="11" fill="#374151" />
                              <circle cx="60" cy="160" r="7" fill="#4B5563" />
                              <circle cx="60" cy="160" r="4" fill="#6B7280" opacity="0.5" />
                              
                              {/* Right wheel */}
                              <circle cx="140" cy="160" r="14" fill="#1F2937" />
                              <circle cx="140" cy="160" r="11" fill="#374151" />
                              <circle cx="140" cy="160" r="7" fill="#4B5563" />
                              <circle cx="140" cy="160" r="4" fill="#6B7280" opacity="0.5" />
                            </g>
                            
                            {/* Enhanced empty state indicators with animation */}
                            <g opacity="0.5">
                              <path d="M55 75 L85 70" stroke="white" strokeWidth="2.5" strokeDasharray="5,5" strokeLinecap="round">
                                <animate attributeName="stroke-dashoffset" values="0;10" dur="2s" repeatCount="indefinite" />
                              </path>
                              <path d="M55 100 L90 94" stroke="white" strokeWidth="2.5" strokeDasharray="5,5" strokeLinecap="round">
                                <animate attributeName="stroke-dashoffset" values="0;10" dur="2s" begin="0.5s" repeatCount="indefinite" />
                              </path>
                              <path d="M55 125 L88 118" stroke="white" strokeWidth="2.5" strokeDasharray="5,5" strokeLinecap="round">
                                <animate attributeName="stroke-dashoffset" values="0;10" dur="2s" begin="1s" repeatCount="indefinite" />
                              </path>
                            </g>
                            
                            {/* Shine effect on cart */}
                            <path d="M45 60 L75 60 L70 90 L50 85 Z" fill="white" opacity="0.3" />
                          </svg>
                        </div>
                        
                        {/* Super Enhanced Yellow Character with personality */}
                        <div className="absolute right-8 top-8 animate-pulse">
                          <svg width="100" height="110" viewBox="0 0 100 110" className="drop-shadow-xl">
                            <defs>
                              <radialGradient id="yellowGradientEnhanced" cx="40%" cy="35%">
                                <stop offset="0%" stopColor="#FEF3C7" />
                                <stop offset="50%" stopColor="#FCD34D" />
                                <stop offset="100%" stopColor="#F59E0B" />
                              </radialGradient>
                              <filter id="glow">
                                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                                <feMerge>
                                  <feMergeNode in="coloredBlur"/>
                                  <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                              </filter>
                            </defs>
                            
                            {/* Main body with enhanced gradient */}
                            <ellipse cx="50" cy="55" rx="40" ry="46" fill="url(#yellowGradientEnhanced)" filter="url(#glow)" />
                            
                            {/* Cheeks */}
                            <ellipse cx="28" cy="62" rx="8" ry="6" fill="#FBBF24" opacity="0.4" />
                            <ellipse cx="72" cy="62" rx="8" ry="6" fill="#FBBF24" opacity="0.4" />
                            
                            {/* Expressive eyes with highlights */}
                            <g>
                              {/* Left eye */}
                              <circle cx="38" cy="50" r="6" fill="#1F2937" />
                              <circle cx="40" cy="48" r="3" fill="white" />
                              <circle cx="39.5" cy="47.5" r="1.5" fill="#1F2937" />
                              {/* Sparkle */}
                              <circle cx="42" cy="46" r="1.5" fill="white" opacity="0.8" />
                              
                              {/* Right eye */}
                              <circle cx="62" cy="50" r="6" fill="#1F2937" />
                              <circle cx="64" cy="48" r="3" fill="white" />
                              <circle cx="63.5" cy="47.5" r="1.5" fill="#1F2937" />
                              {/* Sparkle */}
                              <circle cx="66" cy="46" r="1.5" fill="white" opacity="0.8" />
                            </g>
                            
                            {/* Happy smiling mouth with teeth */}
                            <path
                              d="M32 68 Q50 78 68 68"
                              stroke="#1F2937"
                              strokeWidth="3.5"
                              fill="none"
                              strokeLinecap="round"
                            />
                            {/* Teeth */}
                            <rect x="46" y="68" width="3" height="4" rx="1" fill="white" />
                            <rect x="51" y="68" width="3" height="4" rx="1" fill="white" />
                          </svg>
                        </div>
                        
                        {/* Super Enhanced Pink Notification Badge */}
                        <div className="absolute top-0 right-0 animate-pulse">
                          <div className="relative">
                            {/* Outer glow rings */}
                            <div className="absolute inset-0 bg-pink-400 rounded-2xl blur-xl opacity-60 animate-ping" style={{ animationDuration: '2s' }}></div>
                            <div className="absolute inset-0 bg-pink-300 rounded-xl blur-lg opacity-40 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}></div>
                            
                            {/* Main badge with premium gradient */}
                            <div className="relative w-16 h-16 bg-gradient-to-br from-pink-500 via-pink-600 to-rose-600 rounded-2xl shadow-2xl flex items-center justify-center transform rotate-6 border-3 border-white">
                              <div className="absolute inset-0 bg-gradient-to-br from-white opacity-30 rounded-2xl"></div>
                              <span className="text-white text-xl font-black relative z-10">0</span>
                              
                              {/* Shine effect */}
                              <div className="absolute top-1 left-2 w-4 h-4 bg-white opacity-50 rounded-full blur-sm"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center space-y-4 mb-10">
                      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                        Your cart is empty
                      </h2>
                      <p className="text-gray-500 max-w-md mx-auto text-sm sm:text-base">
                        Looks like you haven't added anything to your cart yet. Start shopping to fill it up!
                      </p>
                    </div>
                    
                    {/* Enhanced Action Buttons with Premium Graphics */}
                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                      {!user && (
                        <Link
                          to="/login"
                          className="group relative flex-1 bg-gradient-to-br from-purple-600 via-purple-500 to-pink-600 hover:from-purple-700 hover:via-purple-600 hover:to-pink-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 hover:-translate-y-1 overflow-hidden"
                        >
                          {/* Animated background pattern */}
                          <div className="absolute inset-0 opacity-20">
                            <div className="absolute inset-0" style={{
                              backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.2) 0%, transparent 50%)',
                            }}></div>
                          </div>
                          
                          {/* Decorative circles */}
                          <div className="absolute -top-2 -left-2 w-16 h-16 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
                          <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-pink-300/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
                          
                          {/* Button content with icon graphic */}
                          <span className="relative z-10 flex items-center justify-center space-x-2">
                            {/* User icon graphic */}
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="font-bold">Sign in</span>
                            <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                          </span>
                          
                          {/* Shine effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        </Link>
                      )}
                      <Link
                        to="/shop"
                        className="group relative flex-1 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-2xl transform hover:scale-105 hover:-translate-y-1 overflow-hidden"
                      >
                        {/* Animated background pattern */}
                        <div className="absolute inset-0 opacity-20">
                          <div className="absolute inset-0" style={{
                            backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(255,255,255,0.2) 0%, transparent 50%)',
                          }}></div>
                        </div>
                        
                        {/* Decorative circles */}
                        <div className="absolute -top-2 -right-2 w-18 h-18 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-cyan-300/20 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
                        
                        {/* Button content with shopping bag graphic */}
                        <span className="relative z-10 flex items-center justify-center space-x-2">
                          {/* Enhanced shopping bag icon with sparkles */}
                          <div className="relative">
                            <ShoppingBag className="w-6 h-6" />
                            {/* Small sparkle effects */}
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full animate-pulse"></div>
                            <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-yellow-200 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                          </div>
                          <span className="font-bold">Explore items</span>
                          <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
                        </span>
                        
                        {/* Shine effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      </Link>
                    </div>

                    {/* Enhanced Quick Links */}
                    <div className="mt-12 w-full max-w-md">
                      <div className="flex items-center justify-center space-x-2 mb-4">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                        <p className="text-sm font-semibold text-gray-700">Popular Categories</p>
                        <Sparkles className="w-4 h-4 text-purple-500" />
                      </div>
                      <div className="flex flex-wrap justify-center gap-3">
                        {[
                          { name: 'Electronics', color: 'from-blue-500 to-cyan-500', icon: '⚡' },
                          { name: 'Fashion', color: 'from-pink-500 to-rose-500', icon: '👗' },
                          { name: 'Home', color: 'from-orange-500 to-amber-500', icon: '🏠' },
                          { name: 'Sports', color: 'from-green-500 to-emerald-500', icon: '⚽' }
                        ].map((category) => (
                          <Link
                            key={category.name}
                            to={`/shop?category=${category.name.toLowerCase()}`}
                            className="group relative px-5 py-2.5 bg-white border-2 border-gray-200 hover:border-transparent text-gray-700 rounded-xl text-sm font-semibold transition-all duration-300 overflow-hidden shadow-sm hover:shadow-lg transform hover:scale-105"
                          >
                            {/* Gradient background on hover */}
                            <div className={`absolute inset-0 bg-gradient-to-r ${category.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                            <span className="relative z-10 flex items-center space-x-2">
                              <span className="text-base">{category.icon}</span>
                              <span className="group-hover:text-white transition-colors duration-300">{category.name}</span>
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Enhanced Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 sticky top-8 overflow-hidden relative">
                {/* Decorative gradient background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full blur-2xl opacity-50"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-100 to-cyan-100 rounded-full blur-xl opacity-50"></div>
                
                <div className="relative z-10 p-6">
                  {/* Enhanced Header */}
                  <div className="flex items-center space-x-2 mb-6">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Order Summary
                    </h2>
                  </div>
                  
                  {/* Enhanced Total Display */}
                  <div className="mb-6 p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 rounded-xl border-2 border-purple-100 relative overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200/30 rounded-full blur-xl"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-pink-200/30 rounded-full blur-lg"></div>
                    
                    <div className="relative z-10">
                      <p className="text-sm font-medium text-gray-600 mb-2 flex items-center space-x-1">
                        <Truck className="w-4 h-4" />
                        <span>Estimated total</span>
                      </p>
                      <div className="flex items-baseline space-x-2">
                        <p className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          ETB 0.00
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Add items to see pricing</p>
                    </div>
                  </div>

                  {/* Enhanced Disabled Checkout Button */}
                  <button
                    disabled
                    className="w-full relative py-4 px-6 rounded-xl font-semibold cursor-not-allowed mb-6 shadow-sm overflow-hidden group"
                    style={{
                      background: 'linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)',
                    }}
                  >
                    {/* Disabled pattern overlay */}
                    <div className="absolute inset-0 opacity-30" style={{
                      backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.05) 10px, rgba(0,0,0,0.05) 20px)',
                    }}></div>
                    <span className="relative z-10 flex items-center justify-center space-x-2 text-gray-400">
                      <CreditCard className="w-5 h-5" />
                      <span>Checkout (0 items)</span>
                    </span>
                  </button>

                  {/* Enhanced Buyer Protection Cards */}
                  <div className="border-t border-gray-200 pt-6 space-y-4">
                    {/* Buyer Protection Card */}
                    <div className="group relative p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 hover:border-green-300 transition-all duration-300 overflow-hidden">
                      {/* Animated background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-green-100/50 to-emerald-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      <div className="relative z-10 flex items-start space-x-3">
                        <div className="p-2 bg-green-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-bold text-green-900 mb-1 flex items-center space-x-1">
                            <span>Buyer Protection</span>
                            <Shield className="w-3 h-3 text-green-600" />
                          </h3>
                          <p className="text-xs text-green-700 leading-relaxed">
                            Get a full refund if the item is not as described or not delivered
                          </p>
                        </div>
                      </div>
                      
                      {/* Decorative corner accent */}
                      <div className="absolute top-0 right-0 w-12 h-12 bg-green-200/20 rounded-bl-full"></div>
                    </div>
                    
                    {/* Secure Checkout Card */}
                    <div className="group relative p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 hover:border-blue-300 transition-all duration-300 overflow-hidden">
                      {/* Animated background */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-100/50 to-cyan-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      <div className="relative z-10 flex items-start space-x-3">
                        <div className="p-2 bg-blue-500 rounded-lg shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <Shield className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-bold text-blue-900 mb-1 flex items-center space-x-1">
                            <span>Secure Checkout</span>
                            <div className="flex space-x-0.5">
                              <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                              <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                              <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                            </div>
                          </h3>
                          <p className="text-xs text-blue-700 leading-relaxed">
                            Your payment information is encrypted and secure
                          </p>
                        </div>
                      </div>
                      
                      {/* Decorative corner accent */}
                      <div className="absolute top-0 right-0 w-12 h-12 bg-blue-200/20 rounded-bl-full"></div>
                    </div>

                    {/* Additional Trust Badge */}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span>Trusted by</span>
                        </div>
                        <span className="font-bold text-gray-700">1000+</span>
                        <span>happy customers</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Recommendations Section - Full Width Below Grid */}
          {recommendedProducts.length > 0 && (
            <div className="mt-12">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 sm:p-12">
                <div className="flex items-center justify-center mb-8">
                  <div className="flex items-center space-x-3">
                    <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      Recommended for You
                    </h2>
                    <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
                  </div>
                </div>
                
                {loadingRecommendations ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  // RESPONSIVE: Horizontal scroll on mobile, grid on desktop
                  <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 overflow-x-auto sm:overflow-x-visible pb-4 sm:pb-0 px-2 sm:px-0 scrollbar-hide">
                    {recommendedProducts.map((product) => (
                      <div key={product.id} className="flex-shrink-0 w-40 sm:w-auto">
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-8 text-center">
                  <Link
                    to="/shop"
                    className="group relative inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600 hover:from-blue-700 hover:via-blue-600 hover:to-cyan-700 text-white px-6 sm:px-10 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 hover:-translate-y-1 overflow-hidden"
                  >
                    {/* Animated background pattern */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute inset-0" style={{
                        backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(255,255,255,0.2) 0%, transparent 50%)',
                      }}></div>
                    </div>
                    
                    {/* Decorative circles */}
                    <div className="absolute -top-2 -left-2 w-12 h-12 bg-white/10 rounded-full blur-lg group-hover:scale-150 transition-transform duration-500"></div>
                    <div className="absolute -bottom-2 -right-2 w-14 h-14 bg-cyan-300/20 rounded-full blur-lg group-hover:scale-150 transition-transform duration-500"></div>
                    
                    {/* Button content */}
                    <span className="relative z-10 flex items-center space-x-2">
                      <ShoppingBag className="w-5 h-5" />
                      <span>View All Products</span>
                      <ArrowRight className="w-5 h-5 transform group-hover:translate-x-2 transition-transform" />
                    </span>
                    
                    {/* Shine effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* RESPONSIVE FIX: Improved padding */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* RESPONSIVE: Stack header on mobile */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <span className="text-sm sm:text-base text-gray-600">{getCartItemsCount()} items</span>
        </div>

        {/* RESPONSIVE: Stack columns on mobile */}
        <div className={cartGridClass}>
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {Object.entries(cartItemsBySeller).map(([sellerName, items]) => (
              <div key={sellerName} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Seller Header - RESPONSIVE */}
                <div className="p-3 sm:p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm sm:text-base font-medium text-gray-900">{sellerName}</span>
                      <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500 flex-shrink-0" />
                    </div>
                    <span className="text-xs sm:text-sm text-gray-600">{items.length} item(s)</span>
                  </div>
                </div>

                {/* Items from this seller - RESPONSIVE: Stack on mobile */}
                <div className="divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <div key={`${item.id}-${item.selectedColor}-${item.selectedSize}`} className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        {/* Product Image - RESPONSIVE: Smaller on mobile */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 mx-auto sm:mx-0">
                          <img
                            src={item.images[0]}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Product Info - RESPONSIVE: Center on mobile */}
                        <div className="flex-1 min-w-0 text-center sm:text-left">
                          <h3 className="text-xs sm:text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                            {item.name}
                          </h3>
                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                            {item.selectedColor && (
                              <span>Color: {item.selectedColor}</span>
                            )}
                            {item.selectedSize && (
                              <span>Size: {item.selectedSize}</span>
                            )}
                          </div>
                          <div className="flex items-center justify-center sm:justify-start space-x-2 mt-2">
                            <span className="text-base sm:text-lg font-bold text-red-600">
                              {formatPrice(item.price)}
                            </span>
                            {item.originalPrice && (
                              <span className="text-xs sm:text-sm text-gray-500 line-through">
                                {formatPrice(item.originalPrice)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quantity Controls - RESPONSIVE: Center on mobile */}
                        <div className="flex items-center justify-center sm:justify-start space-x-2">
                          <button
                            onClick={() => handleQuantityChange(item, item.quantity - 1)}
                            className="p-2 sm:p-1.5 border border-gray-300 rounded hover:bg-gray-50 touch-manipulation"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-4 h-4 sm:w-4 sm:h-4" />
                          </button>
                          <span className="w-10 sm:w-12 text-center border border-gray-300 rounded py-1.5 sm:py-1 text-xs sm:text-sm font-medium">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item, item.quantity + 1)}
                            className="p-2 sm:p-1.5 border border-gray-300 rounded hover:bg-gray-50 touch-manipulation"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-4 h-4 sm:w-4 sm:h-4" />
                          </button>
                        </div>

                        {/* Item Total - RESPONSIVE: Center on mobile */}
                        <div className="text-center sm:text-right">
                          <div className="text-base sm:text-lg font-bold text-gray-900">
                            {formatPrice(item.price * item.quantity)}
                          </div>
                        </div>

                        {/* Actions - RESPONSIVE: Center on mobile */}
                        <div className="flex items-center justify-center sm:justify-start space-x-2">
                          <button
                            onClick={() => addToWishlist(item)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200 touch-manipulation"
                            title="Move to Wishlist"
                            aria-label="Move to wishlist"
                          >
                            <Heart className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveItem(item)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200 touch-manipulation"
                            title="Remove Item"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Clear Cart Button */}
            <div className="flex justify-end">
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-700 font-medium transition-colors duration-200"
              >
                Clear Cart
              </button>
            </div>
          </div>

          {/* Order Summary - RESPONSIVE: Order first on mobile */}
          <div className="lg:col-span-1 order-first lg:order-last">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-4 sm:top-8">
              {/* RESPONSIVE: Adjusted padding */}
              <div className="p-4 sm:p-6">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3 sm:mb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">
                      {shipping === 0 ? 'Free' : formatPrice(shipping)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">{formatPrice(tax)}</span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-bold text-gray-900">Total</span>
                      <span className="text-lg font-bold text-gray-900">{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>

                {/* Shipping Info */}
                {shipping > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
                    <div className="flex items-center space-x-2 text-blue-800">
                      <Truck className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Add {formatPrice(50 - subtotal)} more for free shipping
                      </span>
                    </div>
                  </div>
                )}

                {/* Checkout Button */}
                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full bg-blue-600 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base touch-manipulation"
                >
                  {isCheckingOut ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>Proceed to Checkout</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Security Badge */}
                <div className="mt-6 flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <Shield className="w-4 h-4" />
                  <span>Secure checkout</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}