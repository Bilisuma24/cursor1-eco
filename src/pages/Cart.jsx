import React, { useState } from "react";
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
  CheckCircle
} from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/SupabaseAuthContext";
import { useCart as useSupabaseCart } from "../hooks/useCart";

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

  const cartItemsBySeller = getCartItemsBySeller();
  const subtotal = getCartTotal();
  const shipping = subtotal > 50 ? 0 : 9.99;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Empty Cart Content */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-8">Cart</h1>
                
                {/* Empty Cart Illustration */}
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="relative mb-8">
                    {/* Modern 3D-style Cart Illustration */}
                    <div className="relative w-64 h-64 mx-auto">
                      {/* Shopping Basket */}
                      <div className="absolute inset-x-0 bottom-0">
                        <svg width="160" height="160" viewBox="0 0 160 160" className="mx-auto">
                          {/* Red Shopping Basket */}
                          <path
                            d="M30 50 L30 130 L130 130 L130 50 Z"
                            fill="#EF4444"
                            stroke="#DC2626"
                            strokeWidth="2.5"
                            rx="5"
                          />
                          {/* Basket Handle */}
                          <path
                            d="M20 50 Q20 35 35 35 L50 35"
                            fill="none"
                            stroke="#DC2626"
                            strokeWidth="4"
                            strokeLinecap="round"
                          />
                          {/* Basket Wheels */}
                          <circle cx="50" cy="145" r="10" fill="#1F2937" />
                          <circle cx="110" cy="145" r="10" fill="#1F2937" />
                          {/* Decorative dashed lines */}
                          <path
                            d="M140 60 L155 50 M140 80 L160 70 M140 100 L158 92"
                            stroke="white"
                            strokeWidth="1.5"
                            strokeDasharray="3,3"
                            opacity="0.3"
                          />
                        </svg>
                      </div>
                      
                      {/* Yellow Blob Character */}
                      <div className="absolute right-8 top-4">
                        <svg width="80" height="90" viewBox="0 0 80 90">
                          <ellipse cx="40" cy="45" rx="32" ry="38" fill="#FCD34D" />
                          {/* Eyes */}
                          <circle cx="32" cy="40" r="4" fill="#1F2937" />
                          <circle cx="48" cy="40" r="4" fill="#1F2937" />
                          {/* Mouth */}
                          <path
                            d="M28 52 Q40 58 52 52"
                            stroke="#1F2937"
                            strokeWidth="2.5"
                            fill="none"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                      
                      {/* Pink Notification Badge */}
                      <div className="absolute top-0 right-0">
                        <div className="relative">
                          <div className="w-12 h-12 bg-pink-500 rounded-lg shadow-lg flex items-center justify-center transform rotate-6">
                            <span className="text-white text-sm font-bold">0</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <h2 className="text-3xl font-bold text-gray-900 mb-8">Your cart is empty</h2>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    {!user && (
                      <Link
                        to="/login"
                        className="bg-red-600 hover:bg-red-700 text-white px-10 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        Sign in
                      </Link>
                    )}
                    <Link
                      to="/shop"
                      className="bg-gray-900 hover:bg-gray-800 text-white px-10 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Explore items
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-8">
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Summary</h2>
                  
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-2">Estimated total</p>
                    <p className="text-2xl font-bold text-gray-900">ETB 0.00</p>
                  </div>

                  {/* Checkout Button (Disabled) */}
                  <button
                    disabled
                    className="w-full bg-pink-200 text-gray-500 py-3 px-6 rounded-lg font-medium cursor-not-allowed mb-6"
                  >
                    Checkout (0)
                  </button>

                  {/* Buyer Protection */}
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Buyer protection</h3>
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-600">
                        Get a full refund if the item is not as described or not delivered
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <span className="text-gray-600">{getCartItemsCount()} items</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {Object.entries(cartItemsBySeller).map(([sellerName, items]) => (
              <div key={sellerName} className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Seller Header */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{sellerName}</span>
                      <Shield className="w-4 h-4 text-blue-500" />
                    </div>
                    <span className="text-sm text-gray-600">{items.length} item(s)</span>
                  </div>
                </div>

                {/* Items from this seller */}
                <div className="divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <div key={`${item.id}-${item.selectedColor}-${item.selectedSize}`} className="p-4">
                      <div className="flex items-center space-x-4">
                        {/* Product Image */}
                        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <img
                            src={item.images[0]}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                            {item.name}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            {item.selectedColor && (
                              <span>Color: {item.selectedColor}</span>
                            )}
                            {item.selectedSize && (
                              <span>Size: {item.selectedSize}</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="text-lg font-bold text-red-600">
                              {formatPrice(item.price)}
                            </span>
                            {item.originalPrice && (
                              <span className="text-sm text-gray-500 line-through">
                                {formatPrice(item.originalPrice)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleQuantityChange(item, item.quantity - 1)}
                            className="p-1 border border-gray-300 rounded hover:bg-gray-50"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-12 text-center border border-gray-300 rounded py-1">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item, item.quantity + 1)}
                            className="p-1 border border-gray-300 rounded hover:bg-gray-50"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Item Total */}
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            {formatPrice(item.price * item.quantity)}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => addToWishlist(item)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200"
                            title="Move to Wishlist"
                          >
                            <Heart className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveItem(item)}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200"
                            title="Remove Item"
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

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 sticky top-8">
              <div className="p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
                
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
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
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