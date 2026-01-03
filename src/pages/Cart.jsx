import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Shield,
  CreditCard,
  Zap,
  Star,
  Sparkles
} from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/SupabaseAuthContext";
import { useCart as useSupabaseCart } from "../hooks/useCart";
import { supabase } from "../lib/supabaseClient";
import ProductCard from "../components/ProductCard";
import productsData from "../data/products";

export default function Cart() {
  const navigate = useNavigate();
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal
  } = useCart();

  const { user } = useAuth();
  const { checkout: supabaseCheckout } = useSupabaseCart(user?.id);

  const [isCheckingOut, setIsCheckingOut] = useState(false);
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
      navigate('/signup');
      return;
    }

    setIsCheckingOut(true);
    try {
      await supabaseCheckout();
      alert('Order placed successfully!');
      clearCart();
      navigate('/orders');
    } catch (err) {
      console.error('Checkout error:', err);
      alert(err.message || 'Failed to place order.');
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

  const fetchRecommendedProducts = async () => {
    try {
      setLoadingRecommendations(true);
      console.log('Fetching cart recommendations...');

      // Get categories from cart items
      const cartCategories = [...new Set(cartItems.map(item => item.category).filter(Boolean))];
      console.log('Cart categories:', cartCategories);

      let dbProducts = [];
      let dbError = null;

      // 1. Try to get products from same categories if cart is not empty
      if (cartCategories.length > 0) {
        const { data, error } = await supabase
          .from('product')
          .select('*')
          .in('category', cartCategories)
          .limit(20);

        dbProducts = data || [];
        dbError = error;
      }

      // 2. Fallback to any products if category query failed or returned no results
      if (!dbProducts || dbProducts.length < 5) {
        const { data: popularProducts, error: popularError } = await supabase
          .from('product')
          .select('*')
          .order('id', { ascending: false }) // Fallback to ID ordering if 'sold' doesn't exist
          .limit(20);

        if (popularProducts && popularProducts.length > 0) {
          // Merge results if we had some from categories
          const existingIds = new Set(dbProducts.map(p => p.id));
          const newProducts = popularProducts.filter(p => !existingIds.has(p.id));
          dbProducts = [...dbProducts, ...newProducts];
        }
        if (popularError) console.error('Popular fallback failed:', popularError);
      }

      if (dbError && dbProducts.length === 0) throw dbError;

      // Final fallback to static products if database returned nothing
      if (dbProducts.length === 0) {
        console.log('Database returned no results, falling back to static products');
        const staticProducts = productsData.products.slice(0, 10);
        dbProducts = staticProducts;
      }

      const transformed = (dbProducts || []).map(p => {
        // Handle images (support both array and string)
        let productImages = [];
        if (Array.isArray(p.images)) {
          productImages = p.images;
        } else if (p.image_url) {
          productImages = [p.image_url];
        } else if (typeof p.images === 'string') {
          try {
            const parsed = JSON.parse(p.images);
            if (Array.isArray(parsed)) productImages = parsed;
            else productImages = [p.images];
          } catch {
            productImages = [p.images];
          }
        }

        return {
          id: p.id,
          name: p.name,
          price: parseFloat(p.price) || 0,
          originalPrice: p.original_price ? parseFloat(p.original_price) : null,
          images: productImages.length > 0 ? productImages : ['https://via.placeholder.com/300'],
          category: p.category || 'General',
          rating: p.rating || 4.5,
          sold: p.sold || 0
        };
      });

      // Filter out products already in cart
      const cartProductIds = cartItems.map(item => item.id);
      const filtered = transformed.filter(p => !cartProductIds.includes(p.id));

      console.log('Final recommendations count:', filtered.length);
      setRecommendedProducts(filtered);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      // Last ditch fallback to static products on catch
      const staticProducts = productsData.products.slice(0, 10);
      setRecommendedProducts(staticProducts);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  useEffect(() => {
    fetchRecommendedProducts();
  }, [cartItems.length]); // Re-fetch whenever cart item count changes

  const subtotal = getCartTotal();
  const shipping = subtotal > 0 ? 200 : 0;
  const tax = subtotal * 0.1;
  const total = subtotal + shipping + tax;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#f1f4f9] py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-xl mx-auto text-center mb-16">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
              <ShoppingBag className="w-12 h-12 text-gray-300" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
            <p className="text-gray-500 mb-8 text-lg">Items remain in your cart for 60 minutes. Start shopping to fill it up!</p>
            <Link to="/" className="inline-flex items-center gap-2 bg-[#3b82f6] text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-md active:scale-95">
              Go Shopping <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Recommendations for Empty Cart */}
          {(loadingRecommendations || recommendedProducts.length > 0) && (
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">

                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">You might love</h2>
                  </div>
                </div>
                <Link to="/" className="text-[#3b82f6] font-bold hover:underline flex items-center gap-1">
                  View All <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {loadingRecommendations ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 animate-pulse">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="aspect-[3/4] bg-gray-100 rounded-xl" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                  {recommendedProducts.slice(0, 12).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f1f4f9] pb-20 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-[#191919] mb-6">Shopping Cart</h1>

        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* Main Cart Content */}
          <div className="flex-1 space-y-6">
            {/* Cart Items */}
            <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
              <div className="divide-y divide-gray-100">
                {cartItems.map((item, index) => (
                  <div key={`${item.id}-${item.selectedColor}-${item.selectedSize}-${index}`} className="p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                    {/* Image - 1:1 Frame */}
                    <div className="w-24 h-24 sm:w-28 sm:h-28 aspect-square shrink-0 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center border border-gray-50">
                      <img
                        src={item.images?.[0] || item.image || '/placeholder-product.jpg'}
                        alt={item.name}
                        className="w-full h-full object-contain mix-blend-multiply"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/150?text=No+Image";
                        }}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] sm:text-base font-medium text-gray-900 mb-1 line-clamp-2">{item.name}</h3>
                      <p className="text-gray-700 font-bold text-sm">ETB {formatPrice(item.price)}</p>
                    </div>

                    {/* Unit Total (Desktop) */}
                    <div className="hidden lg:block w-32 text-center font-bold text-gray-900">
                      ETB {formatPrice(item.price * item.quantity)}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-6 sm:gap-8">
                      <div className="flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden shadow-sm">
                        <button
                          onClick={() => handleQuantityChange(item, Math.max(1, item.quantity - 1))}
                          className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                        <span className="w-8 sm:w-9 text-center font-bold text-sm text-gray-900 border-x border-gray-300 py-1.5 flex items-center justify-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item, item.quantity + 1)}
                          className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center hover:bg-gray-50 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleRemoveItem(item)}
                        className="text-[#3b82f6] hover:underline font-bold text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Products Section */}
            {recommendedProducts.length > 0 && (
              <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">

                    <div>
                      <h2 className="text-xl font-bold text-gray-900">You might love</h2>
                    </div>
                  </div>
                  <Link to="/" className="text-[#3b82f6] text-sm font-bold hover:underline">
                    View More
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {recommendedProducts.slice(0, 10).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Checkout Summary */}
          <div className="w-full lg:w-[380px] shrink-0">
            <div className="bg-white rounded-[20px] p-8 shadow-sm border border-gray-100 sticky top-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-gray-900 font-medium">
                  <span>Subtotal:</span>
                  <span>ETB {formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-gray-900 font-medium">
                  <span>Shipping:</span>
                  <span>ETB {formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between items-center text-gray-900 font-medium">
                  <span>Tax:</span>
                  <span>ETB {formatPrice(tax)}</span>
                </div>

                <div className="pt-6 mt-6 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-lg font-bold">Total:</span>
                  <span className="text-xl font-bold">ETB {formatPrice(total)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isCheckingOut || !user}
                className="w-full py-4 bg-[#3b82f6] text-white rounded-full font-bold text-lg hover:bg-blue-600 transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
              >
                {isCheckingOut ? 'Processing...' : 'Checkout'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}