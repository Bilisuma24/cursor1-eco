import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import productsData from "../data/products";
import { useToast } from "./ToastContext";
import { useAuth } from "./SupabaseAuthContext";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [wishlistDbAvailable, setWishlistDbAvailable] = useState(true);
  const { user } = useAuth();
  const { push: pushToast } = useToast();

  // Helper to detect UUID-looking IDs (Supabase tables use UUIDs)
  const isValidUuid = useCallback((value) => {
    if (typeof value !== 'string') return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }, []);

  // Load cart and wishlist from localStorage (for guests)
  const loadLocalCartAndWishlist = useCallback(() => {
    const savedCart = localStorage.getItem('cart');
    const savedWishlist = localStorage.getItem('wishlist');
    
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
    if (savedWishlist) {
      setWishlist(JSON.parse(savedWishlist));
    }
  }, []);

  // Helper function to get auth token
  const getAuthToken = useCallback(async () => {
    try {
      const sessionTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session timeout')), 2000)
      );
      const { data: { session } } = await Promise.race([
        supabase.auth.getSession(),
        sessionTimeout
      ]);
      return session?.access_token || null;
    } catch (e) {
      return null;
    }
  }, []);

  // Load cart and wishlist from database (for logged-in users) - Supabase client
  const loadUserCartAndWishlist = useCallback(async (userId) => {
    setLoading(true);
    try {
      // Load cart via Supabase client with joined product details
      const { data: cartData, error: cartError } = await supabase
        .from('cart')
        .select(`
          *,
          product:product_id (*)
        `)
        .eq('user_id', userId);

      if (cartError) {
        console.error('Error loading cart:', cartError);
      } else {
        const transformedCartItems = (cartData || []).map(item => {
          const productFromJoin = item.product || null;
          // Fallback to static productsData by id if join not available
          const productFromStatic = productsData.products.find(p => p.id === item.product_id);
          const product = productFromJoin || productFromStatic || {};
          return {
            cartId: item.id,
            id: item.product_id,
            product_id: item.product_id,
            quantity: item.quantity,
            selectedColor: item.selected_color,
            selectedSize: item.selected_size,
            addedAt: item.created_at,
            ...product,
          };
        }).filter(item => item && (item.name || item.product_id)) || [];
        setCartItems(transformedCartItems);
      }

      // Load wishlist via Supabase client with joined product details
      const { data: wishlistData, error: wishlistError } = await supabase
        .from('wishlist')
        .select(`
          *,
          product:product_id (*)
        `)
        .eq('user_id', userId);

      if (wishlistError) {
        // Graceful fallback when wishlist table doesn't exist yet
        if (wishlistError.code === 'PGRST205' || wishlistError.code === 'PGRST116' || 
            wishlistError.status === 404 || 
            /Could not find the table/i.test(wishlistError.message || '') ||
            /relation.*wishlist.*does not exist/i.test(wishlistError.message || '')) {
          // Silently disable wishlist DB if table doesn't exist (avoid console spam)
          if (wishlistDbAvailable) {
            setWishlistDbAvailable(false);
            if (import.meta.env.DEV) {
              console.log('ℹ️ Wishlist table not found - using localStorage fallback');
            }
          }
          const savedWishlist = localStorage.getItem('wishlist');
          setWishlist(savedWishlist ? JSON.parse(savedWishlist) : []);
        } else {
          // Only log non-404 errors
          if (wishlistError.status !== 404) {
            console.error('Error loading wishlist:', wishlistError);
          }
        }
      } else {
        const transformedWishlist = (wishlistData || []).map(item => {
          const productFromJoin = item.product || null;
          const productFromStatic = productsData.products.find(p => p.id === item.product_id);
          const product = productFromJoin || productFromStatic || {};
          return {
            wishlistId: item.id,
            id: item.product_id,
            product_id: item.product_id,
            addedAt: item.created_at,
            ...product,
          };
        }).filter(item => item && (item.name || item.product_id)) || [];
        setWishlist(transformedWishlist);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    } finally {
      setLoading(false);
    }
  }, [getAuthToken, wishlistDbAvailable]);

  // Save cart to localStorage (always persist local state; DB sync/clear handled elsewhere)
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Save wishlist to localStorage (always persist local state; DB sync/clear handled elsewhere)
  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Local cart operations (for guests or fallback)
  const addToCartLocal = useCallback((product, quantity = 1, selectedColor = null, selectedSize = null) => {
    setCartItems(prev => {
      const existingItem = prev.find(
        item => item.id === product.id && 
        item.selectedColor === selectedColor && 
        item.selectedSize === selectedSize
      );

      if (existingItem) {
        return prev.map(item => 
          item.id === product.id && 
          item.selectedColor === selectedColor && 
          item.selectedSize === selectedSize
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        const newItem = {
          ...product,
          quantity,
          selectedColor,
          selectedSize,
          addedAt: new Date().toISOString()
        };
        return [...prev, newItem];
      }
    });
  }, []);

  const addToCart = useCallback(async (product, quantity = 1, selectedColor = null, selectedSize = null) => {
    console.log('addToCart called:', { product: product?.name, quantity, user: user?.id, hasUser: !!user });
    
    if (!product || !product.id) {
      console.error('Invalid product:', product);
      throw new Error('Invalid product');
    }

    // If not authenticated, redirect to login
    if (!user) {
      pushToast({ type: 'info', title: 'Login Required', message: 'Please log in to add items to your cart' });
      window.location.href = '/login';
      return;
    }

    if (user) {
      // Fallback to local storage when product ids are not UUIDs (e.g., demo/static products)
      if (!isValidUuid(product.id)) {
        addToCartLocal(product, quantity, selectedColor, selectedSize);
        pushToast({ type: 'info', title: 'Added to cart', message: `${product.name} added (local cart)` });
        return;
      }
      // User is logged in - save to database via Supabase client
      try {
        // Check if item already exists (handle null vs value for color/size)
        let checkQuery = supabase
          .from('cart')
          .select('*')
          .eq('user_id', user.id)
          .eq('product_id', product.id);
        checkQuery = selectedColor == null
          ? checkQuery.is('selected_color', null)
          : checkQuery.eq('selected_color', selectedColor);
        checkQuery = selectedSize == null
          ? checkQuery.is('selected_size', null)
          : checkQuery.eq('selected_size', selectedSize);
        const { data: existingItems, error: checkError } = await checkQuery;

        if (checkError) throw checkError;

        if (existingItems && existingItems.length > 0) {
          const existingItem = existingItems[0];
          const { error: updateError } = await supabase
            .from('cart')
            .update({ quantity: existingItem.quantity + quantity })
            .eq('id', existingItem.id);

          if (updateError) throw updateError;
          pushToast({ type: 'success', title: 'Cart updated', message: `${product.name} quantity updated` });
        } else {
          const { error: insertError } = await supabase
            .from('cart')
            .insert({
              user_id: user.id,
              product_id: product.id,
              quantity,
              selected_color: selectedColor,
              selected_size: selectedSize,
            });
          if (insertError) throw insertError;
          pushToast({ type: 'success', title: 'Added to cart', message: `${product.name} added to cart` });
        }

        await loadUserCartAndWishlist(user.id);
      } catch (err) {
        console.error('Error adding to cart in database:', err);
        // Fallback to local storage if database operation fails
        console.warn('Falling back to local storage for cart');
        addToCartLocal(product, quantity, selectedColor, selectedSize);
        pushToast({ type: 'info', title: 'Added to cart', message: `${product.name} added (local cart)` });
      }
    }
  }, [user, loadUserCartAndWishlist, addToCartLocal, getAuthToken, pushToast, isValidUuid]);

  const removeFromCart = useCallback(async (id, selectedColor = null, selectedSize = null) => {
    if (user) {
      // User is logged in - remove via Supabase client
      try {
        let del = supabase
          .from('cart')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', id);
        del = selectedColor == null ? del.is('selected_color', null) : del.eq('selected_color', selectedColor);
        del = selectedSize == null ? del.is('selected_size', null) : del.eq('selected_size', selectedSize);
        const { error: deleteError } = await del;

        if (deleteError) throw deleteError;
        await loadUserCartAndWishlist(user.id);
        pushToast({ type: 'success', title: 'Removed from cart', message: 'Item removed' });
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
      pushToast({ type: 'success', title: 'Removed from cart', message: 'Item removed' });
    }
  }, [user, loadUserCartAndWishlist, getAuthToken]);

  const updateQuantity = useCallback(async (id, selectedColor, selectedSize, newQuantity) => {
    if (newQuantity <= 0) {
      await removeFromCart(id, selectedColor, selectedSize);
      return;
    }

    if (user) {
      // User is logged in - update in database via REST API
      try {
        const supabaseUrl = 'https://azvslusinlvnjymaufhw.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6dnNsdXNpbmx2bmp5bWF1Zmh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NjYwNjYsImV4cCI6MjA3NTU0MjA2Nn0.4MdiznfE-UOdDn25X8XocML44UrCxpsJ2fIgvULevnw';
        const authToken = await getAuthToken() || supabaseKey;

        // Find the cart item first (null-safe match)
        let find = supabase
          .from('cart')
          .select('*')
          .eq('user_id', user.id)
          .eq('product_id', id);
        find = selectedColor == null ? find.is('selected_color', null) : find.eq('selected_color', selectedColor);
        find = selectedSize == null ? find.is('selected_size', null) : find.eq('selected_size', selectedSize);
        const { data: items, error: findError } = await find;

        if (!findError && items && items.length > 0) {
          const { error: updateError } = await supabase
            .from('cart')
            .update({ quantity: newQuantity })
            .eq('id', items[0].id);
          if (!updateError) {
            await loadUserCartAndWishlist(user.id);
            pushToast({ type: 'success', title: 'Quantity updated', message: 'Cart item quantity updated' });
          }
        }
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
  }, [user, loadUserCartAndWishlist, removeFromCart, getAuthToken]);

  const clearCart = useCallback(async () => {
    if (user) {
      // User is logged in - clear from database via REST API
      try {
        const supabaseUrl = 'https://azvslusinlvnjymaufhw.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6dnNsdXNpbmx2bmp5bWF1Zmh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NjYwNjYsImV4cCI6MjA3NTU0MjA2Nn0.4MdiznfE-UOdDn25X8XocML44UrCxpsJ2fIgvULevnw';
        const authToken = await getAuthToken() || supabaseKey;

        const deleteResponse = await fetch(
          `${supabaseUrl}/rest/v1/cart?user_id=eq.${user.id}`,
          {
            method: 'DELETE',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${authToken}`,
              'Prefer': 'return=minimal'
            }
          }
        );

        if (deleteResponse.ok) {
          setCartItems([]);
          pushToast({ type: 'success', title: 'Cart cleared', message: 'All items removed' });
        }
      } catch (err) {
        console.error('Error clearing cart:', err);
      }
    } else {
      // Guest user - clear from localStorage
      setCartItems([]);
      pushToast({ type: 'success', title: 'Cart cleared', message: 'All items removed' });
    }
  }, [user, getAuthToken]);

  // Local wishlist operations (for guests or fallback)
  const addToWishlistLocal = useCallback((product) => {
    setWishlist(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (!existingItem) {
        const newItem = { ...product, addedAt: new Date().toISOString() };
        return [...prev, newItem];
      }
      return prev;
    });
  }, []);

  const addToWishlist = useCallback(async (product) => {
    console.log('addToWishlist called:', { product: product?.name, user: user?.id, hasUser: !!user });
    
    if (!product || !product.id) {
      console.error('Invalid product:', product);
      throw new Error('Invalid product');
    }

    // If not authenticated, redirect to login
    if (!user) {
      pushToast({ type: 'info', title: 'Login Required', message: 'Please log in to add items to your wishlist' });
      window.location.href = '/login';
      return;
    }

    // If wishlist table unavailable, add locally (fallback)
    if (!wishlistDbAvailable) {
      addToWishlistLocal(product);
      pushToast({ type: 'success', title: 'Added to wishlist', message: `${product.name} added` });
      return;
    }

    if (user) {
      // Fallback to local storage when product ids are not UUIDs (e.g., demo/static products)
      if (!isValidUuid(product.id)) {
        addToWishlistLocal(product);
        pushToast({ type: 'info', title: 'Added to wishlist', message: `${product.name} added (local)` });
        return;
      }
      // User is logged in - save to database via Supabase client
      try {
        const { error: insertError } = await supabase
          .from('wishlist')
          .insert({
            user_id: user.id,
            product_id: product.id,
          });

        if (insertError) {
          // If duplicate
          if (insertError.code === '23505') {
            pushToast({ type: 'info', title: 'Already in wishlist', message: `${product.name}` });
            await loadUserCartAndWishlist(user.id);
          } else {
            throw insertError;
          }
        } else {
          pushToast({ type: 'success', title: 'Added to wishlist', message: `${product.name} added` });
          await loadUserCartAndWishlist(user.id);
        }
      } catch (err) {
        console.error('Error adding to wishlist in database:', err);
        pushToast({ type: 'error', title: 'Error', message: 'Failed to add item to wishlist. Please try again.' });
      }
    }
  }, [user, loadUserCartAndWishlist, addToWishlistLocal, getAuthToken, pushToast, isValidUuid, wishlistDbAvailable]);

  const removeFromWishlist = useCallback(async (id) => {
    if (user && wishlistDbAvailable) {
      // User is logged in - remove via Supabase client
      try {
        const { error: deleteError } = await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', id);

        if (!deleteError) {
          await loadUserCartAndWishlist(user.id);
          pushToast({ type: 'success', title: 'Removed from wishlist', message: 'Item removed' });
        } else {
          pushToast({ type: 'error', title: 'Error', message: 'Failed to remove item from wishlist' });
        }
      } catch (err) {
        console.error('Error removing from wishlist:', err);
        pushToast({ type: 'error', title: 'Error', message: 'Failed to remove item from wishlist' });
      }
    } else {
      // Guest user - remove from localStorage
      setWishlist(prev => prev.filter(item => item.id !== id));
      pushToast({ type: 'success', title: 'Removed from wishlist', message: 'Item removed' });
    }
  }, [user, loadUserCartAndWishlist, pushToast, wishlistDbAvailable]);

  const isInWishlist = useCallback((id) => {
    return wishlist.some(item => item.id === id);
  }, [wishlist]);

  const getCartTotal = useCallback(() => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cartItems]);

  const getCartItemsCount = useCallback(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const getCartItemsBySeller = useCallback(() => {
    const grouped = {};
    cartItems.forEach(item => {
      const seller = item.seller?.name || 'Unknown Seller';
      if (!grouped[seller]) {
        grouped[seller] = [];
      }
      grouped[seller].push(item);
    });
    return grouped;
  }, [cartItems]);

  // Sync localStorage data to database when user logs in - REST API
  const syncLocalDataToDatabase = useCallback(async (userId) => {
    try {
      const supabaseUrl = 'https://azvslusinlvnjymaufhw.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6dnNsdXNpbmx2bmp5bWF1Zmh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NjYwNjYsImV4cCI6MjA3NTU0MjA2Nn0.4MdiznfE-UOdDn25X8XocML44UrCxpsJ2fIgvULevnw';
      const authToken = await getAuthToken() || supabaseKey;

      // Get localStorage data
      const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
      const localWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');

      // If demo/static products (non-UUID ids) exist, keep them local and load into state
      const hasNonUuidCart = localCart.some(item => !isValidUuid(item.id));
      const hasNonUuidWishlist = localWishlist.some(item => !isValidUuid(item.id));
      if (hasNonUuidCart || hasNonUuidWishlist) {
        if (hasNonUuidCart) {
          setCartItems(localCart);
        }
        if (hasNonUuidWishlist) {
          setWishlist(localWishlist);
        }
        // Do not attempt to sync or clear local for non-UUID items
        return;
      }

      // Sync cart items
      let allCartSynced = true;
      for (const item of localCart) {
        try {
          const insertResponse = await fetch(`${supabaseUrl}/rest/v1/cart`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${authToken}`,
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              user_id: userId,
              product_id: item.id,
              quantity: item.quantity,
              selected_color: item.selectedColor,
              selected_size: item.selectedSize,
            })
          });

          if (!insertResponse.ok) {
            const errorText = await insertResponse.text();
            // Ignore duplicate key error (23505)
            if (!errorText.includes('23505')) {
              console.error('Error syncing cart item:', errorText);
              allCartSynced = false;
            }
          }
        } catch (err) {
          console.error('Error syncing cart item:', err);
          allCartSynced = false;
        }
      }

      // Sync wishlist items (only if table available)
      let allWishlistSynced = true;
      if (wishlistDbAvailable) {
        for (const item of localWishlist) {
          try {
            const insertResponse = await fetch(`${supabaseUrl}/rest/v1/wishlist`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${authToken}`,
                'Prefer': 'return=minimal'
              },
              body: JSON.stringify({
                user_id: userId,
                product_id: item.id,
              })
            });

            if (!insertResponse.ok) {
              const errorText = await insertResponse.text();
              // Ignore duplicate key error (23505)
              if (!errorText.includes('23505')) {
                console.error('Error syncing wishlist item:', errorText);
                allWishlistSynced = false;
              }
            }
          } catch (err) {
            console.error('Error syncing wishlist item:', err);
            allWishlistSynced = false;
          }
        }
      }

      // Clear localStorage only if everything synced successfully
      if (allCartSynced && allWishlistSynced) {
        localStorage.removeItem('cart');
        localStorage.removeItem('wishlist');
      }
    } catch (err) {
      console.error('Error syncing local data:', err);
    }
  }, [getAuthToken, isValidUuid, wishlistDbAvailable]);

  // Listen for auth state changes and load initial data
  useEffect(() => {
    let mounted = true;
    
    const loadDataForUser = async (userId) => {
      if (!mounted) return;
      try {
        await syncLocalDataToDatabase(userId);
        await loadUserCartAndWishlist(userId);
      } catch (error) {
        console.error('Error loading data for user:', error);
      }
    };

    if (user) {
      // If local storage has non-UUID items, prefer local to avoid overwriting by empty DB
      const localCart = JSON.parse(localStorage.getItem('cart') || '[]');
      const localWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
      const hasNonUuid = localCart.some(i => !isValidUuid(i.id)) || localWishlist.some(i => !isValidUuid(i.id));
      if (hasNonUuid) {
        loadLocalCartAndWishlist();
      } else {
        // User is logged in - load their data
        loadDataForUser(user.id);
      }
    } else {
      // No user - load from localStorage
      loadLocalCartAndWishlist();
    }

    return () => {
      mounted = false;
    };
  }, [user, loadLocalCartAndWishlist, loadUserCartAndWishlist, syncLocalDataToDatabase, isValidUuid]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
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
  }), [
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
  ]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

// ✅ Custom hook that lets any component access the cart
export function useCart() {
  const context = useContext(CartContext);
  
  if (!context) {
    console.error('useCart must be used within CartProvider');
    // Return a default object with no-op functions to prevent crashes
    return {
      cartItems: [],
      wishlist: [],
      loading: false,
      addToCart: async () => { console.error('Cart not initialized'); },
      updateQuantity: async () => { console.error('Cart not initialized'); },
      removeFromCart: async () => { console.error('Cart not initialized'); },
      clearCart: async () => { console.error('Cart not initialized'); },
      addToWishlist: async () => { console.error('Cart not initialized'); },
      removeFromWishlist: async () => { console.error('Cart not initialized'); },
      isInWishlist: () => false,
      getCartTotal: () => 0,
      getCartItemsCount: () => 0,
      getCartItemsBySeller: () => ({}),
    };
  }
  
  return context;
}
