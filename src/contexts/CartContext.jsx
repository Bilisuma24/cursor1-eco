import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [wishlist, setWishlist] = useState([]);

  // Load cart and wishlist from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    const savedWishlist = localStorage.getItem('wishlist');
    
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
    if (savedWishlist) {
      setWishlist(JSON.parse(savedWishlist));
    }
  }, []);

  // Save cart and wishlist to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const addToCart = (product, quantity = 1, selectedColor = null, selectedSize = null) => {
    const existingItem = cartItems.find(
      item => item.id === product.id && 
      item.selectedColor === selectedColor && 
      item.selectedSize === selectedSize
    );

    if (existingItem) {
      setCartItems(prev => 
        prev.map(item => 
          item.id === product.id && 
          item.selectedColor === selectedColor && 
          item.selectedSize === selectedSize
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
    } else {
      setCartItems(prev => [...prev, {
        ...product,
        quantity,
        selectedColor,
        selectedSize,
        addedAt: new Date().toISOString()
      }]);
    }
  };

  const updateQuantity = (id, selectedColor, selectedSize, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(id, selectedColor, selectedSize);
      return;
    }

    setCartItems(prev =>
      prev.map(item =>
        item.id === id && 
        item.selectedColor === selectedColor && 
        item.selectedSize === selectedSize
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeFromCart = (id, selectedColor = null, selectedSize = null) => {
    setCartItems(prev => 
      prev.filter(item => 
        !(item.id === id && 
          item.selectedColor === selectedColor && 
          item.selectedSize === selectedSize)
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const addToWishlist = (product) => {
    if (!wishlist.find(item => item.id === product.id)) {
      setWishlist(prev => [...prev, { ...product, addedAt: new Date().toISOString() }]);
    }
  };

  const removeFromWishlist = (id) => {
    setWishlist(prev => prev.filter(item => item.id !== id));
  };

  const isInWishlist = (id) => {
    return wishlist.some(item => item.id === id);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemsCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getCartItemsBySeller = () => {
    const grouped = {};
    cartItems.forEach(item => {
      const seller = item.seller?.name || 'Unknown Seller';
      if (!grouped[seller]) {
        grouped[seller] = [];
      }
      grouped[seller].push(item);
    });
    return grouped;
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        wishlist,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        getCartTotal,
        getCartItemsCount,
        getCartItemsBySeller,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ✅ Custom hook that lets any component access the cart
export function useCart() {
  return useContext(CartContext);
}
