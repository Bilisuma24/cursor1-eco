import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useCart(userId) {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch cart items on mount and when userId changes
  useEffect(() => {
    if (!userId) {
      setCartItems([]);
      setLoading(false);
      return;
    }

    fetchCartItems();
  }, [userId]);

  // Fetch cart items from Supabase
  const fetchCartItems = async () => {
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('cart')
        .select(`
          *,
          product:product_id (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        throw fetchError;
      }

      // Transform data to match product structure
      const transformedItems = data.map(item => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        ...item.product,
      }));

      setCartItems(transformedItems || []);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Add product to cart
  const addToCart = async (product, quantity = 1) => {
    if (!userId) {
      throw new Error('User must be logged in to add items to cart');
    }

    try {
      setError(null);

      // Check if item already exists in cart
      const { data: existingItem } = await supabase
        .from('cart')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', product.id)
        .single();

      if (existingItem) {
        // Update quantity if item exists
        const newQuantity = existingItem.quantity + quantity;
        const { error: updateError } = await supabase
          .from('cart')
          .update({ quantity: newQuantity })
          .eq('id', existingItem.id);

        if (updateError) throw updateError;
      } else {
        // Insert new item if it doesn't exist
        const { error: insertError } = await supabase
          .from('cart')
          .insert({
            user_id: userId,
            product_id: product.id,
            quantity,
          });

        if (insertError) throw insertError;
      }

      // Refresh cart items
      await fetchCartItems();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Remove item from cart
  const removeFromCart = async (cartId) => {
    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from('cart')
        .delete()
        .eq('id', cartId);

      if (deleteError) throw deleteError;

      // Refresh cart items
      await fetchCartItems();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Update quantity of cart item
  const updateQuantity = async (cartId, newQuantity) => {
    if (newQuantity <= 0) {
      await removeFromCart(cartId);
      return;
    }

    try {
      setError(null);
      const { error: updateError } = await supabase
        .from('cart')
        .update({ quantity: newQuantity })
        .eq('id', cartId);

      if (updateError) throw updateError;

      // Refresh cart items
      await fetchCartItems();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Clear all cart items
  const clearCart = async () => {
    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from('cart')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      setCartItems([]);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Get cart items (already in state)
  const getCartItems = () => {
    return cartItems;
  };

  // Get total price
  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Get cart items count
  const getCartItemsCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  // Checkout - create order and clear cart
  const checkout = async () => {
    if (!userId) {
      throw new Error('User must be logged in to checkout');
    }

    try {
      setError(null);
      
      // Call the Supabase Edge Function to create order
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }

      // Get the Supabase URL from environment or use default
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://azvslusinlvnjymaufhw.supabase.co';
      
      console.log('Calling checkout function at:', `${supabaseUrl}/functions/v1/create_order`);
      
      const response = await fetch(`${supabaseUrl}/functions/v1/create_order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create order';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error('Checkout error:', errorData);
        } catch (e) {
          console.error('Failed to parse error response:', e);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const { order } = await response.json();

      // Clear cart
      await clearCart();

      return { order };
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message);
      throw err;
    }
  };

  return {
    cartItems,
    loading,
    error,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartItems,
    getCartTotal,
    getCartItemsCount,
    checkout,
  };
}
