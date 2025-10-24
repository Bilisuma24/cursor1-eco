import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight,
  Heart,
  Truck,
  Shield,
  CreditCard
} from "lucide-react";
import { useCart } from "../contexts/CartContext";

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

  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleQuantityChange = (item, newQuantity) => {
    updateQuantity(item.id, item.selectedColor, item.selectedSize, newQuantity);
  };

  const handleRemoveItem = (item) => {
    removeFromCart(item.id, item.selectedColor, item.selectedSize);
  };

  const handleCheckout = () => {
    setIsCheckingOut(true);
    // Simulate checkout process
    setTimeout(() => {
      // Build order payload and persist
      try {
        const existing = JSON.parse(localStorage.getItem('orders') || '[]');
        const orderId = `ORD-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(Math.random()*900)+100}`;
        const items = cartItems.map((item) => ({
          id: item.id,
          name: item.name,
          image: item.images?.[0],
          price: item.price,
          quantity: item.quantity,
          seller: item.seller?.name || 'Unknown Seller',
          selectedColor: item.selectedColor || null,
          selectedSize: item.selectedSize || null,
        }));

        const order = {
          id: orderId,
          date: new Date().toISOString(),
          status: 'processing',
          subtotal,
          shipping,
          tax,
          total,
          items,
          tracking: null,
        };
        const updated = [order, ...existing];
        localStorage.setItem('orders', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save order', e);
      }
      alert('Order placed successfully!');
      clearCart();
      navigate('/orders');
      setIsCheckingOut(false);
    }, 2000);
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
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-8">Looks like you haven't added any items to your cart yet.</p>
            <button
              onClick={() => navigate('/shop')}
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              Continue Shopping
            </button>
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
        </div>
    </div>
  );
}