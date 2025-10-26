// supabase/functions/create_order/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get cart items for the user
    const { data: cartItems, error: cartError } = await supabase
      .from('cart')
      .select(`
        id,
        product_id,
        quantity,
        product:product_id (
          id,
          name,
          price
        )
      `)
      .eq('user_id', user.id);

    if (cartError) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch cart items', details: cartError.message }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if cart is empty
    if (!cartItems || cartItems.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Cart is empty' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Calculate total price
    let totalPrice = 0;
    const orderItems = cartItems.map(item => {
      const price = item.product.price;
      const subtotal = price * item.quantity;
      totalPrice += subtotal;
      
      return {
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_purchase: price,
      };
    });

    // Get shipping address from profile (optional)
    const { data: profile } = await supabase
      .from('profile')
      .select('address')
      .eq('user_id', user.id)
      .single();

    const shippingAddress = profile?.address || '';

    // Create the order
    const { data: newOrder, error: orderError } = await supabase
      .from('order')
      .insert({
        user_id: user.id,
        total_price: totalPrice,
        status: 'pending',
        shipping_address: shippingAddress,
      })
      .select()
      .single();

    if (orderError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create order', details: orderError.message }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create order items
    const orderItemsData = orderItems.map(item => ({
      order_id: newOrder.id,
      ...item,
    }));

    const { error: orderItemsError } = await supabase
      .from('order_items')
      .insert(orderItemsData);

    if (orderItemsError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create order items', details: orderItemsError.message }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Clear the cart after successful order
    const { error: deleteCartError } = await supabase
      .from('cart')
      .delete()
      .eq('user_id', user.id);

    if (deleteCartError) {
      console.error('Failed to clear cart:', deleteCartError);
      // Don't fail the order if cart clearing fails
    }

    // Return the created order with items
    const { data: orderWithItems, error: fetchError } = await supabase
      .from('order')
      .select(`
        *,
        order_items (
          *,
          product:product_id (
            name,
            image_url
          )
        )
      `)
      .eq('id', newOrder.id)
      .single();

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: 'Order created but failed to fetch details', details: fetchError.message }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        order: orderWithItems,
      }),
      { 
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
