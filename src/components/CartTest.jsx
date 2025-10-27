import React from 'react';
import { useCart } from '../contexts/CartContext';
import productsData from '../data/products';

export default function CartTest() {
  const { addToCart, addToWishlist, cartItems, wishlist, loading, user } = useCart();
  
  const testProduct = productsData.products[0]; // Get first product for testing
  
  const handleTestCart = () => {
    console.log('Testing add to cart...');
    addToCart(testProduct, 1);
  };
  
  const handleTestWishlist = () => {
    console.log('Testing add to wishlist...');
    addToWishlist(testProduct);
  };
  
  return (
    <div style={{ padding: '20px', border: '2px solid red', margin: '20px' }}>
      <h2>Cart & Wishlist Test Component</h2>
      <p><strong>User:</strong> {user ? user.email : 'Not logged in'}</p>
      <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
      <p><strong>Cart Items:</strong> {cartItems.length}</p>
      <p><strong>Wishlist Items:</strong> {wishlist.length}</p>
      
      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={handleTestCart}
          style={{ padding: '10px', marginRight: '10px', backgroundColor: 'blue', color: 'white' }}
        >
          Test Add to Cart
        </button>
        
        <button 
          onClick={handleTestWishlist}
          style={{ padding: '10px', backgroundColor: 'green', color: 'white' }}
        >
          Test Add to Wishlist
        </button>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Cart Items:</h3>
        {cartItems.map((item, index) => (
          <div key={index} style={{ border: '1px solid gray', padding: '10px', margin: '5px' }}>
            <p><strong>Name:</strong> {item.name}</p>
            <p><strong>Quantity:</strong> {item.quantity}</p>
            <p><strong>Price:</strong> ${item.price}</p>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h3>Wishlist Items:</h3>
        {wishlist.map((item, index) => (
          <div key={index} style={{ border: '1px solid gray', padding: '10px', margin: '5px' }}>
            <p><strong>Name:</strong> {item.name}</p>
            <p><strong>Price:</strong> ${item.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
