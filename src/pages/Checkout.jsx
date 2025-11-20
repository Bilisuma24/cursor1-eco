import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  ArrowLeft, 
  CreditCard, 
  MapPin, 
  Truck, 
  Lock,
  CheckCircle,
  User,
  Phone,
  Mail
} from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/SupabaseAuthContext";
import { useCart as useSupabaseCart } from "../hooks/useCart";
import { ProtectedRoute } from "../components/ProtectedRoute";

export default function Checkout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    cartItems, 
    getCartTotal, 
    getCartItemsCount,
    clearCart 
  } = useCart();
  const { checkout: supabaseCheckout } = useSupabaseCart(user?.id);

  const [shippingInfo, setShippingInfo] = useState({
    fullName: user?.user_metadata?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States'
  });

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/cart');
    }
  }, [cartItems, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePlaceOrder = async () => {
    // Validate form
    if (!shippingInfo.fullName || !shippingInfo.email || !shippingInfo.phone || 
        !shippingInfo.address || !shippingInfo.city || !shippingInfo.state || !shippingInfo.zipCode) {
      setError('Please fill in all required fields');
      return;
    }

    if (!user) {
      navigate('/signup');
      return;
    }

    setIsPlacingOrder(true);
    setError(null);

    try {
      await supabaseCheckout();
      alert('Order placed successfully!');
      clearCart();
      navigate('/orders');
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const subtotal = getCartTotal();
  const shipping = 0; // Free shipping
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Your cart is empty</p>
          <Link to="/shop" className="text-blue-600 hover:underline">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 pb-20 sm:pb-0">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/cart')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Checkout</h1>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Information */}
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
                <div className="flex items-center space-x-2 mb-4">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-900">Shipping Information</h2>
                </div>
                
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          name="fullName"
                          value={shippingInfo.fullName}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="email"
                          name="email"
                          value={shippingInfo.email}
                          onChange={handleInputChange}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="tel"
                        name="phone"
                        value={shippingInfo.phone}
                        onChange={handleInputChange}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={shippingInfo.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={shippingInfo.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        State <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={shippingInfo.state}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ZIP Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="zipCode"
                        value={shippingInfo.zipCode}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
                <div className="flex items-center space-x-2 mb-4">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-900">Payment Method</h2>
                </div>
                
                <div className="space-y-3">
                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <CreditCard className="w-5 h-5 ml-3 text-gray-600" />
                    <span className="ml-3 font-medium text-gray-900">Credit/Debit Card</span>
                  </label>
                  
                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                    <input
                      type="radio"
                      name="payment"
                      value="paypal"
                      checked={paymentMethod === 'paypal'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3 font-medium text-gray-900">PayPal</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm sticky top-20">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
                
                {/* Cart Items */}
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={`${item.id}-${item.selectedColor}-${item.selectedSize}`} className="flex items-stretch space-x-3">
                      <div className="w-24 sm:w-28 lg:w-32 h-full min-h-[70px] sm:min-h-[80px] bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.images?.[0] || '/placeholder.png'}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        {(item.selectedColor || item.selectedSize) && (
                          <p className="text-xs text-gray-500">
                            {item.selectedColor && `${item.selectedColor}`}
                            {item.selectedColor && item.selectedSize && ', '}
                            {item.selectedSize && `${item.selectedSize}`}
                          </p>
                        )}
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tax</span>
                    <span>{formatPrice(tax)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Place Order Button */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={isPlacingOrder}
                  className="w-full mt-6 bg-gradient-to-r from-orange-600 to-orange-700 text-white py-3.5 px-4 rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all duration-200 font-bold flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation shadow-md active:scale-95"
                >
                  <Lock className="w-5 h-5" />
                  <span>{isPlacingOrder ? 'Placing Order...' : 'Place Order'}</span>
                </button>

                <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-gray-500">
                  <Lock className="w-4 h-4" />
                  <span>Secure checkout</span>
                </div>
              </div>
            </div>
        </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
