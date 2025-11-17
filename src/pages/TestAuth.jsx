import React, { useState } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { useCart } from '../contexts/CartContext';

const TestAuth = () => {
  const { user, loading } = useAuth();
  const { addToCart, addToWishlist, cartItems, wishlist } = useCart();
  const [testResult, setTestResult] = useState('');

  const testProduct = {
    id: 'test-product-1',
    name: 'Test Product',
    price: 29.99,
    images: ['https://via.placeholder.com/300']
  };

  const handleTestCart = async () => {
    try {
      setTestResult('Testing cart add...');
      await addToCart(testProduct, 1);
      setTestResult('Cart add successful!');
    } catch (error) {
      setTestResult(`Cart add failed: ${error.message}`);
    }
  };

  const handleTestWishlist = async () => {
    try {
      setTestResult('Testing wishlist add...');
      await addToWishlist(testProduct);
      setTestResult('Wishlist add successful!');
    } catch (error) {
      setTestResult(`Wishlist add failed: ${error.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Authentication Test Page</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Current State</h2>
        <div className="space-y-2">
          <p><strong>User:</strong> {user ? user.email : 'Not logged in'}</p>
          <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
          <p><strong>Cart Items:</strong> {cartItems.length}</p>
          <p><strong>Wishlist Items:</strong> {wishlist.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Test Actions</h2>
        <div className="space-x-4">
          <button
            onClick={handleTestCart}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test Add to Cart
          </button>
          <button
            onClick={handleTestWishlist}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Test Add to Wishlist
          </button>
        </div>
        {testResult && (
          <div className="mt-4 p-3 bg-gray-100 rounded">
            <p>{testResult}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Session Storage</h2>
        <div className="space-y-2">
          <p><strong>Auth Action:</strong> {sessionStorage.getItem('authAction') || 'None'}</p>
          <p><strong>Auth Redirect:</strong> {sessionStorage.getItem('authRedirect') || 'None'}</p>
          <p><strong>Pending Cart Item:</strong> {sessionStorage.getItem('pendingCartItem') ? 'Yes' : 'No'}</p>
          <p><strong>Pending Wishlist Item:</strong> {sessionStorage.getItem('pendingWishlistItem') ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </div>
  );
};

export default TestAuth;






















