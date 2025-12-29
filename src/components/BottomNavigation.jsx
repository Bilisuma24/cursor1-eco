import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Grid, ShoppingCart, User } from 'lucide-react';
import { useCart } from '../contexts/CartContext';

export default function BottomNavigation() {
  const location = useLocation();
  const { cartCount } = useCart();

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around py-2" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
        <Link
          to="/"
          className="flex flex-col items-center gap-1"
        >
          <div className="w-6 h-6 flex items-center justify-center">
            <div className={`w-5 h-5 border-2 rounded-sm flex items-center justify-center ${isActive('/') ? 'border-red-500' : 'border-gray-300'
              }`}>
              <div className={`w-2 h-2 rounded-sm ${isActive('/') ? 'bg-red-500' : 'bg-gray-300'
                }`}></div>
            </div>
          </div>
          <span className={`text-xs font-medium ${isActive('/') ? 'text-red-500' : 'text-gray-600'
            }`}>Home</span>
        </Link>
        <Link
          to="/shop"
          className="flex flex-col items-center gap-1"
        >
          <div className="w-6 h-6 flex items-center justify-center">
            <div className={`w-5 h-5 border-2 rounded-sm flex items-center justify-center ${isActive('/shop') ? 'border-red-500' : 'border-gray-300'
              }`}>
              <div className={`w-2 h-2 rounded-sm ${isActive('/shop') ? 'bg-red-500' : 'bg-gray-300'
                }`}></div>
            </div>
          </div>
          <span className={`text-xs font-medium ${isActive('/shop') ? 'text-red-500' : 'text-gray-600'
            }`}>Category</span>
        </Link>
        <Link
          to="/cart"
          className="flex flex-col items-center gap-1 relative"
        >
          <ShoppingCart className={`w-6 h-6 ${isActive('/cart') ? 'text-red-500' : 'text-gray-600'
            }`} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-[#ff4747] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              {cartCount}
            </span>
          )}
          <span className={`text-xs font-medium ${isActive('/cart') ? 'text-red-500' : 'text-gray-600'
            }`}>Cart</span>
        </Link>
        <Link
          to="/account"
          className="flex flex-col items-center gap-1"
        >
          <User className={`w-6 h-6 ${isActive('/account') || isActive('/profile') ? 'text-red-500' : 'text-gray-600'
            }`} />
          <span className={`text-xs font-medium ${isActive('/account') || isActive('/profile') ? 'text-red-500' : 'text-gray-600'
            }`}>Account</span>
        </Link>
      </div>
    </div>
  );
}

