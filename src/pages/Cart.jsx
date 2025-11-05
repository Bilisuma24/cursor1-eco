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
  Sparkles,
  User,
  Zap,
  Shirt,
  Star
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
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  // Fetch recommended products
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
            const svgString = '<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="#f3f4f6"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="18" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>';
            const svgPlaceholder = `data:image/svg+xml;base64,${btoa(svgString)}`;
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

  // Fetch recommended products when cart is empty
  useEffect(() => {
    if (cartItems.length === 0) {
      fetchRecommendedProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems.length]);

  const cartItemsBySeller = getCartItemsBySeller ? getCartItemsBySeller() : {};
  const subtotal = getCartTotal();
  const shipping = subtotal > 50 ? 0 : 9.99;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;
  const cartGridClass = "grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-8";
  
  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      clearCart();
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 overflow-x-hidden pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="py-4 mb-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Cart
                  </h1>
                </div>
                
          {/* Empty Cart Content - Centered */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 md:p-12 mb-6">
            <div className="flex flex-col items-center justify-center py-8 md:py-12">
              {/* Empty Cart Message */}
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 text-center">
                      Your cart is empty
                    </h2>
                  
              {/* Action Buttons - Stacked Vertically */}
              <div className="flex flex-col gap-3 items-center">
                    {!user && (
                      <Link
                        to="/login"
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg inline-flex items-center justify-center space-x-2 w-44 whitespace-nowrap"
                  >
                    <User className="w-4 h-4" />
                          <span>Sign in</span>
                    <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                    <Link
                      to="/shop"
                  className="bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg inline-flex items-center justify-center space-x-2 w-44 whitespace-nowrap"
                >
                  <ShoppingBag className="w-4 h-4" />
                        <span className="font-bold">Explore items</span>
                  <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
              </div>
            </div>
            
          {/* More to love Recommendations Section - Below */}
          {recommendedProducts.length > 0 && (
            <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">More to love</h3>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {loadingRecommendations ? (
                  <div className="flex items-center justify-center w-full py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
              </div>
                ) : (
                  recommendedProducts.map((product) => (
                    <div key={product.id} className="flex-shrink-0 w-36 sm:w-40">
                      <ProductCard product={product} />
                      </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden pb-20 md:pb-0">
      {/* RESPONSIVE FIX: Compact padding */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className={cartGridClass}>
          {/* Left Column - Cart Items */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Cart Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Shopping Cart ({`${cartItems.length} ${cartItems.length === 1 ? 'item' : 'items'}`})
                  </h1>
                {cartItems.length > 0 && (
                  <button
                    onClick={handleClearCart}
                    className="flex items-center space-x-2 text-red-600 hover:text-red-700 font-medium text-sm transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Clear Cart</span>
                  </button>
                )}
              </div>
            </div>

            {/* Cart Items */}
            {cartItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Product Card */}
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Product Image */}
                    <Link to={`/product/${item.id}`} className="flex-shrink-0">
                      <div className="relative w-full sm:w-32 h-32 sm:h-32 bg-gray-100 rounded-lg overflow-hidden group">
                        <img
                          src={item.images?.[0] || item.image || '/placeholder-product.jpg'}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        {item.originalPrice && item.originalPrice > item.price && (
                          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                            {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% OFF
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Product Details */}
                    <div className="flex-1 flex flex-col sm:flex-row sm:justify-between gap-4">
                      <div className="flex-1">
                        <Link to={`/product/${item.id}`} className="block">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 hover:text-purple-600 transition-colors mb-2 line-clamp-2">
                            {item.name}
                          </h3>
                        </Link>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-lg sm:text-xl font-bold text-gray-900">
                            ETB{formatPrice(item.price)}
                          </span>
                          {item.originalPrice && item.originalPrice > item.price && (
                            <span className="text-sm text-gray-500 line-through">
                              ETB{formatPrice(item.originalPrice)}
                            </span>
                          )}
                        </div>
                        {item.color && (
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm text-gray-600">Color:</span>
                            <div
                              className="w-6 h-6 rounded-full border-2 border-gray-300"
                              style={{ backgroundColor: item.color }}
                            ></div>
                          </div>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center gap-4">
                        <div className="flex items-center space-x-3 bg-gray-100 rounded-lg p-2">
                          <button
                            onClick={() => handleQuantityChange(item, Math.max(1, item.quantity - 1))}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4 text-gray-600" />
                          </button>
                          <span className="text-base font-semibold text-gray-900 min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item, item.quantity + 1)}
                            className="p-1 hover:bg-gray-200 rounded transition-colors"
                          >
                            <Plus className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>

                        <div className="flex flex-col items-end">
                          <span className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                            ETB{formatPrice(item.price * item.quantity)}
                          </span>
                          <button
                            onClick={() => handleRemoveItem(item)}
                            className="flex items-center space-x-1 text-red-600 hover:text-red-700 text-sm font-medium transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column - Order Summary */}
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
                        ETB{formatPrice(total)}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {shipping === 0 ? 'Free shipping!' : `+ ETB${formatPrice(shipping)} shipping`}
                    </p>
                  </div>
                </div>

                {/* Enhanced Checkout Button */}
                <button
                  onClick={handleCheckout}
                  className="w-full relative py-4 px-6 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-700 hover:via-pink-700 hover:to-rose-700 text-white rounded-xl font-semibold text-base transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] overflow-hidden mb-6"
                >
                  {/* Decorative background effects */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 hover:opacity-100 transition-opacity"></div>
                  <div className="absolute -top-2 -right-2 w-20 h-20 bg-white/10 rounded-full blur-xl hover:scale-150 transition-transform duration-500"></div>
                  
                  <span className="relative z-10 flex items-center justify-center space-x-2">
                    <CreditCard className="w-5 h-5" />
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-5 h-5" />
                  </span>
                  
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-1000"></div>
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
                  <>
                    {/* RESPONSIVE: Horizontal scroll on mobile, grid on desktop */}
                    <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 overflow-x-auto sm:overflow-x-visible pb-4 sm:pb-0 px-2 sm:px-0 scrollbar-hide">
                    {recommendedProducts.map((product) => (
                      <div key={product.id} className="flex-shrink-0 w-40 sm:w-auto">
                        <ProductCard product={product} />
                      </div>
                    ))}
                    </div>
                  </>
                )}
                
                <div className="mt-8 text-center">
                  <Link
                    to="/shop"
                    className="group relative inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600 hover:from-blue-700 hover:via-blue-600 hover:to-cyan-700 text-white px-6 sm:px-10 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 hover:-translate-y-1 overflow-hidden"
                  >
                    {/* Animated background pattern */}
                    <div className="absolute inset-0 opacity-20">
                      <div 
                        className="absolute inset-0" 
                        style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(255,255,255,0.2) 0%, transparent 50%)' }}
                      ></div>
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