import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import productsData from "../data/products";

const CartContext = createContext();

export function CartProvider({ children }) {
  console.log('=== CART PROVIDER INITIALIZED ===');
  const [cartItems, setCartItems] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  // Listen for auth state changes and load initial data
  useEffect(() => {
    // Load initial data first
    const loadInitialData = async () => {
      console.log('=== INITIAL LOAD DEBUG ===');
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session:', session);
      if (session?.user) {
        console.log('User found, syncing localStorage and loading from database:', session.user.id);
        setUser(session.user);
        await syncLocalDataToDatabase(session.user.id);
        await loadUserCartAndWishlist(session.user.id);
      } else {
        console.log('No user, loading from localStorage');
        loadLocalCartAndWishlist();
      }
    };

    loadInitialData();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // User logged in - sync localStorage to database, then load from database
        console.log('User logged in, syncing localStorage to database...');
        await syncLocalDataToDatabase(session.user.id);
        await loadUserCartAndWishlist(session.user.id);
      } else {
        // User logged out - load from localStorage
        console.log('User logged out, loading from localStorage...');
        loadLocalCartAndWishlist();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load cart and wishlist from localStorage (for guests)
  const loadLocalCartAndWishlist = () => {
    const savedCart = localStorage.getItem('cart');
    const savedWishlist = localStorage.getItem('wishlist');
    
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
    if (savedWishlist) {
      setWishlist(JSON.parse(savedWishlist));
    }
  };

  // Load cart and wishlist from database (for logged-in users)
  const loadUserCartAndWishlist = async (userId) => {
    console.log('=== LOAD USER DATA DEBUG ===');
    console.log('Loading data for user:', userId);
    setLoading(true);
    try {
      // Load cart from database
      console.log('Loading cart from database...');
      const { data: cartData, error: cartError } = await supabase
        .from('cart')
        .select('*')
        .eq('user_id', userId);

      console.log('Cart data:', cartData);
      console.log('Cart error:', cartError);

      if (cartError) {
        console.error('Error loading cart:', cartError);
      } else {
        // Transform cart items with static product data
        const transformedCartItems = cartData?.map(item => {
          const product = productsData.products.find(p => p.id === item.product_id);
          return {
            cartId: item.id, // Keep database cart ID for updates/deletes
            id: item.product_id, // Use product ID for UI logic
            product_id: item.product_id,
            quantity: item.quantity,
            selectedColor: item.selected_color,
            selectedSize: item.selected_size,
            addedAt: item.created_at,
            ...product, // Spread product data from static data
          };
        }).filter(item => item.name) || []; // Filter out items where product wasn't found
        setCartItems(transformedCartItems);
      }

      // Load wishlist from database
      console.log('Loading wishlist from database...');
      const { data: wishlistData, error: wishlistError } = await supabase
        .from('wishlist')
        .select('*')
        .eq('user_id', userId);

      console.log('Wishlist data:', wishlistData);
      console.log('Wishlist error:', wishlistError);

      if (wishlistError) {
        console.error('Error loading wishlist:', wishlistError);
      } else {
        // Transform wishlist items with static product data
        const transformedWishlist = wishlistData?.map(item => {
          const product = productsData.products.find(p => p.id === item.product_id);
          return {
            wishlistId: item.id, // Keep database wishlist ID for deletes
            id: item.product_id, // Use product ID for UI logic
            product_id: item.product_id,
            addedAt: item.created_at,
            ...product, // Spread product data from static data
          };
        }).filter(item => item.name) || []; // Filter out items where product wasn't found
        setWishlist(transformedWishlist);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Save cart to localStorage (for guests)
  useEffect(() => {
    if (!user) {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    }
  }, [cartItems, user]);

  // Save wishlist to localStorage (for guests)
  useEffect(() => {
    if (!user) {
      localStorage.setItem('wishlist', JSON.stringify(wishlist));
    }
  }, [wishlist, user]);

  const addToCart = async (product, quantity = 1, selectedColor = null, selectedSize = null) => {
    console.log('=== ADD TO CART DEBUG ===');
    console.log('Product:', product);
    console.log('Quantity:', quantity);
    console.log('Selected Color:', selectedColor);
    console.log('Selected Size:', selectedSize);
    console.log('User:', user);
    console.log('Current cart items:', cartItems);
    
    if (user) {
      // User is logged in - save to database
      console.log('User logged in, saving to database...');
      try {
        // Check if item already exists
        const { data: existingItems, error: fetchError } = await supabase
          .from('cart')
          .select('*')
          .eq('user_id', user.id)
          .eq('product_id', product.id)
          .eq('selected_color', selectedColor)
          .eq('selected_size', selectedSize);

        if (fetchError) {
          console.error('Error fetching existing cart items:', fetchError);
          throw fetchError;
        }

        if (existingItems && existingItems.length > 0) {
          // Update quantity if item exists
          console.log('Updating existing cart item in database');
          const existingItem = existingItems[0];
          const { error: updateError } = await supabase
            .from('cart')
            .update({ quantity: existingItem.quantity + quantity })
            .eq('id', existingItem.id);
          
          if (updateError) {
            console.error('Error updating cart item:', updateError);
            throw updateError;
          }
        } else {
          // Insert new item
          console.log('Inserting new cart item to database');
          const { error: insertError } = await supabase
            .from('cart')
            .insert({
              user_id: user.id,
              product_id: product.id,
              quantity,
              selected_color: selectedColor,
              selected_size: selectedSize,
            });
          
          if (insertError) {
            console.error('Error inserting cart item:', insertError);
            throw insertError;
          }
        }

        // Refresh cart from database
        console.log('Refreshing cart from database...');
        await loadUserCartAndWishlist(user.id);
        console.log('Successfully added to cart in database');
      } catch (err) {
        console.error('Error adding to cart in database:', err);
        console.log('Falling back to localStorage...');
        addToCartLocal(product, quantity, selectedColor, selectedSize);
      }
    } else {
      // Guest user - save to localStorage
      console.log('No user, saving to localStorage...');
      addToCartLocal(product, quantity, selectedColor, selectedSize);
    }
  };

  const addToCartLocal = (product, quantity = 1, selectedColor = null, selectedSize = null) => {
    console.log('=== ADD TO CART LOCAL DEBUG ===');
    console.log('Product:', product);
    console.log('Quantity:', quantity);
    console.log('Current cartItems before:', cartItems);
    
    const existingItem = cartItems.find(
      item => item.id === product.id && 
      item.selectedColor === selectedColor && 
      item.selectedSize === selectedSize
    );

    console.log('Existing item found:', existingItem);

    if (existingItem) {
      console.log('Updating existing item quantity');
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
      console.log('Adding new item to cart');
      const newItem = {
        ...product,
        quantity,
        selectedColor,
        selectedSize,
        addedAt: new Date().toISOString()
      };
      console.log('New item:', newItem);
      setCartItems(prev => [...prev, newItem]);
    }
    
    console.log('Cart update completed');
  };

  const updateQuantity = async (id, selectedColor, selectedSize, newQuantity) => {
    if (newQuantity <= 0) {
      await removeFromCart(id, selectedColor, selectedSize);
      return;
    }

    if (user) {
      // User is logged in - update in database
      try {
        const { error } = await supabase
          .from('cart')
          .update({ quantity: newQuantity })
          .eq('user_id', user.id)
          .eq('product_id', id)
          .eq('selected_color', selectedColor)
          .eq('selected_size', selectedSize);
        
        if (error) throw error;
        await loadUserCartAndWishlist(user.id);
      } catch (err) {
        console.error('Error updating quantity:', err);
      }
    } else {
      // Guest user - update in localStorage
      setCartItems(prev =>
        prev.map(item =>
          item.id === id && 
          item.selectedColor === selectedColor && 
          item.selectedSize === selectedSize
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }
  };

  const removeFromCart = async (id, selectedColor = null, selectedSize = null) => {
    if (user) {
      // User is logged in - remove from database
      try {
        const { error } = await supabase
          .from('cart')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', id)
          .eq('selected_color', selectedColor)
          .eq('selected_size', selectedSize);
        
        if (error) throw error;
        await loadUserCartAndWishlist(user.id);
      } catch (err) {
        console.error('Error removing from cart:', err);
      }
    } else {
      // Guest user - remove from localStorage
      setCartItems(prev => 
        prev.filter(item => 
          !(item.id === id && 
            item.selectedColor === selectedColor && 
            item.selectedSize === selectedSize)
        )
      );
    }
  };

  const clearCart = async () => {
    if (user) {
      // User is logged in - clear from database
      try {
        const { error } = await supabase
          .from('cart')
          .delete()
          .eq('user_id', user.id);
        
        if (error) throw error;
        setCartItems([]);
      } catch (err) {
        console.error('Error clearing cart:', err);
      }
    } else {
      // Guest user - clear from localStorage
      setCartItems([]);
    }
  };

  const addToWishlist = async (product) => {
    console.log('=== ADD TO WISHLIST DEBUG ===');
    console.log('Product:', product);
    console.log('User:', user);
    console.log('Current wishlist:', wishlist);
    
    if (user) {
      // User is logged in - save to database
      console.log('User logged in, saving to database...');
      try {
        const { error } = await supabase
          .from('wishlist')
          .insert({
            user_id: user.id,
            product_id: product.id,
          });
        
        if (error && error.code !== '23505') { // Ignore duplicate key error
          console.error('Error adding to wishlist:', error);
          throw error;
        }
        
        console.log('Successfully added to wishlist in database');
        await loadUserCartAndWishlist(user.id);
      } catch (err) {
        console.error('Error adding to wishlist in database:', err);
        console.log('Falling back to localStorage...');
        addToWishlistLocal(product);
      }
    } else {
      // Guest user - save to localStorage
      console.log('No user, saving to localStorage...');
      addToWishlistLocal(product);
    }
  };

  const addToWishlistLocal = (product) => {
    console.log('=== ADD TO WISHLIST LOCAL DEBUG ===');
    console.log('Product:', product);
    console.log('Current wishlist before:', wishlist);
    
    const existingItem = wishlist.find(item => item.id === product.id);
    console.log('Existing wishlist item found:', existingItem);
    
    if (!existingItem) {
      console.log('Adding new item to wishlist');
      const newItem = { ...product, addedAt: new Date().toISOString() };
      console.log('New wishlist item:', newItem);
      setWishlist(prev => [...prev, newItem]);
    } else {
      console.log('Item already in wishlist, skipping');
    }
    
    console.log('Wishlist update completed');
  };

  const removeFromWishlist = async (id) => {
    if (user) {
      // User is logged in - remove from database
      try {
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', id);
        
        if (error) throw error;
        await loadUserCartAndWishlist(user.id);
      } catch (err) {
        console.error('Error removing from wishlist:', err);
      }
    } else {
      // Guest user - remove from localStorage
      setWishlist(prev => prev.filter(item => item.id !== id));
    }
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

  // Sync localStorage data to database when user logs in
  const syncLocalDataToDatabase = async (userId) => {
    console.log('=== SYNC LOCAL DATA TO DATABASE ===');
    try {
      // Get localStorage data
      const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
      const localWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');

      console.log('Local cart items to sync:', localCart.length);
      console.log('Local wishlist items to sync:', localWishlist.length);

      // Sync cart items
      for (const item of localCart) {
        try {
          console.log('Syncing cart item:', item.name);
          const { error } = await supabase
            .from('cart')
            .insert({
              user_id: userId,
              product_id: item.id,
              quantity: item.quantity,
              selected_color: item.selectedColor,
              selected_size: item.selectedSize,
            });
          
          if (error && error.code !== '23505') { // Ignore duplicate key error
            console.error('Error syncing cart item:', error);
          } else {
            console.log('Successfully synced cart item');
          }
        } catch (err) {
          console.error('Error syncing cart item:', err);
        }
      }

      // Sync wishlist items
      for (const item of localWishlist) {
        try {
          console.log('Syncing wishlist item:', item.name);
          const { error } = await supabase
            .from('wishlist')
            .insert({
              user_id: userId,
              product_id: item.id,
            });
          
          if (error && error.code !== '23505') { // Ignore duplicate key error
            console.error('Error syncing wishlist item:', error);
          } else {
            console.log('Successfully synced wishlist item');
          }
        } catch (err) {
          console.error('Error syncing wishlist item:', err);
        }
      }

      // Clear localStorage after sync
      console.log('Clearing localStorage after sync');
      localStorage.removeItem('cart');
      localStorage.removeItem('wishlist');
      console.log('Sync completed successfully');
    } catch (err) {
      console.error('Error syncing local data:', err);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        wishlist,
        loading,
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
        syncLocalDataToDatabase,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ✅ Custom hook that lets any component access the cart
export function useCart() {
  console.log('=== USE CART HOOK CALLED ===');
  const context = useContext(CartContext);
  console.log('Cart context:', context);
  return context;
}
