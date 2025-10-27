import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';

export default function SimpleCartTest() {
  const { addToCart, addToWishlist, cartItems, wishlist } = useCart();
  const [testResult, setTestResult] = useState('');
  
  const testCart = () => {
    try {
      console.log('=== SIMPLE CART TEST ===');
      console.log('addToCart function:', addToCart);
      console.log('cartItems before:', cartItems);
      
      // Test with a simple product object
      const testProduct = {
        id: 999,
        name: 'Test Product',
        price: 10.99,
        description: 'Test description'
      };
      
      console.log('Calling addToCart with:', testProduct);
      addToCart(testProduct, 1);
      
      console.log('cartItems after:', cartItems);
      setTestResult('Cart test completed - check console');
    } catch (error) {
      console.error('Cart test error:', error);
      setTestResult('Cart test failed: ' + error.message);
    }
  };
  
  const testWishlist = () => {
    try {
      console.log('=== SIMPLE WISHLIST TEST ===');
      console.log('addToWishlist function:', addToWishlist);
      console.log('wishlist before:', wishlist);
      
      // Test with a simple product object
      const testProduct = {
        id: 888,
        name: 'Test Wishlist Product',
        price: 15.99,
        description: 'Test wishlist description'
      };
      
      console.log('Calling addToWishlist with:', testProduct);
      addToWishlist(testProduct);
      
      console.log('wishlist after:', wishlist);
      setTestResult('Wishlist test completed - check console');
    } catch (error) {
      console.error('Wishlist test error:', error);
      setTestResult('Wishlist test failed: ' + error.message);
    }
  };
  
  return (
    <div style={{ padding: '20px', border: '3px solid blue', margin: '20px', backgroundColor: '#f0f0f0' }}>
      <h2>🔧 Simple Cart & Wishlist Test</h2>
      <p><strong>Cart Items Count:</strong> {cartItems.length}</p>
      <p><strong>Wishlist Items Count:</strong> {wishlist.length}</p>
      <p><strong>Test Result:</strong> {testResult}</p>
      
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={testCart}
          style={{ 
            padding: '15px 20px', 
            marginRight: '10px', 
            backgroundColor: 'blue', 
            color: 'white',
            fontSize: '16px',
            border: 'none',
            borderRadius: '5px'
          }}
        >
          🛒 Test Add to Cart
        </button>
        
        <button 
          onClick={testWishlist}
          style={{ 
            padding: '15px 20px', 
            backgroundColor: 'green', 
            color: 'white',
            fontSize: '16px',
            border: 'none',
            borderRadius: '5px'
          }}
        >
          ❤️ Test Add to Wishlist
        </button>
      </div>
      
      <div style={{ marginTop: '20px', fontSize: '14px' }}>
        <p><strong>Instructions:</strong></p>
        <ol>
          <li>Open browser console (F12)</li>
          <li>Click the test buttons above</li>
          <li>Check console for detailed logs</li>
          <li>Check if cart/wishlist counts change</li>
        </ol>
      </div>
    </div>
  );
}
