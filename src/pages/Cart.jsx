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
      const { data: dbProducts, error: dbError } = await supabase
        .from('product')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (dbError) throw dbError;

      const transformed = (dbProducts || []).map(p => ({
        id: p.id,
        name: p.name,
        price: parseFloat(p.price) || 0,
        originalPrice: p.original_price ? parseFloat(p.original_price) : null,
        images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [p.image_url].filter(Boolean),
        category: p.category || 'General',
        rating: p.rating || 4.5,
        sold: p.sold || 0
      }));

      setRecommendedProducts(transformed);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  useEffect(() => {
    fetchRecommendedProducts();
  }, []);

  const subtotal = getCartTotal();
  const shipping = subtotal > 0 ? 200 : 0;
  const tax = subtotal * 0.1;
  const total = subtotal + shipping + tax;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#f1f4f9] py-20 px-4">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <ShoppingBag className="w-12 h-12 text-gray-300" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
          <p className="text-gray-500 mb-8">Items remain in your cart for 60 minutes.</p>
          <Link to="/shop" className="inline-flex items-center gap-2 bg-[#3b82f6] text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-md">
            Go Shopping <ArrowRight className="w-5 h-5" />
          </Link>
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
          <div className="flex-1 bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden">
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

          {/* Checkout Summary */}
          <div className="w-full lg:w-[380px] shrink-0">
            <div className="bg-white rounded-[20px] p-8 shadow-sm border border-gray-100">
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

        {/* More to Love Suggestions */}
        {recommendedProducts.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Recommended for you
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {recommendedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}