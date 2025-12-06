import { supabase } from '../lib/supabaseClient';

export const orderService = {
  // Get seller orders (simplified version)
  async fetchSellerOrders(sellerId, statusFilter = null) {
    try {
      // First get seller's product IDs
      const { data: sellerProducts, error: productsError } = await supabase
        .from('product')
        .select('id')
        .eq('seller_id', sellerId);

      if (productsError) throw productsError;

      if (!sellerProducts || sellerProducts.length === 0) {
        return [];
      }

      const productIds = sellerProducts.map(p => p.id);

      // Get orders that contain seller's products
      const { data: orders, error: ordersError } = await supabase
        .from('order')
        .select(`
          id,
          total_price,
          status,
          created_at,
          shipping_address,
          user_id,
          order_items (
            id,
            quantity,
            price_at_purchase,
            product_id,
            product (
              name,
              images
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Filter orders to only include those with seller's products
      const sellerOrders = orders.filter(order => 
        order.order_items.some(item => productIds.includes(item.product_id))
      ).map(order => ({
        ...order,
        order_items: order.order_items.filter(item => productIds.includes(item.product_id))
      }));

      // Fetch customer profiles separately
      const userIds = [...new Set(sellerOrders.map(order => order.user_id).filter(Boolean))];
      let profilesMap = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profile')
          .select('user_id, full_name, username')
          .in('user_id', userIds);
        
        if (profiles) {
          profilesMap = profiles.reduce((acc, profile) => {
            acc[profile.user_id] = profile;
            return acc;
          }, {});
        }
      }

      // Add profile data to orders
      const sellerOrdersWithProfiles = sellerOrders.map(order => ({
        ...order,
        profile: profilesMap[order.user_id] || null
      }));

      // Apply status filter if provided
      if (statusFilter) {
        return sellerOrdersWithProfiles.filter(order => order.status === statusFilter);
      }

      return sellerOrdersWithProfiles;
    } catch (error) {
      console.error('Error fetching seller orders:', error);
      throw error;
    }
  },

  // Get recent orders for dashboard
  async getRecentOrders(sellerId, limit = 5) {
    try {
      const orders = await this.fetchSellerOrders(sellerId);
      
      // Transform orders to match dashboard expectations
      const transformedOrders = orders.slice(0, limit).map(order => {
        // Calculate seller revenue from order items
        const sellerRevenue = order.order_items.reduce((sum, item) => 
          sum + (item.price_at_purchase * item.quantity), 0
        );
        
        // Transform order_items to sellerItems format
        const sellerItems = order.order_items.map(item => ({
          productName: item.product?.name || 'Unknown Product',
          quantity: item.quantity,
          price: item.price_at_purchase,
          total: item.price_at_purchase * item.quantity,
          productImage: item.product?.images?.[0] || null
        }));
        
        // Get customer name from profile or use user_id as fallback
        const customerName = order.profile?.full_name || 
                           order.profile?.username || 
                           `Customer ${order.user_id?.slice(0, 8)}` ||
                           'Customer';
        
        return {
          ...order,
          sellerRevenue,
          sellerItems,
          customerName
        };
      });
      
      return transformedOrders;
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      throw error;
    }
  },

  // Update order status
  async updateOrderStatus(orderId, status) {
    try {
      const { data, error } = await supabase
        .from('order')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  // Get order details
  async getOrderDetails(orderId) {
    try {
      const { data, error } = await supabase
        .from('order')
        .select(`
          *,
          order_items (
            *,
            product:product_id (
              *
            )
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching order details:', error);
      throw error;
    }
  },

  // Get buyer orders (for buyers to view their orders)
  async fetchBuyerOrders(userId, statusFilter = null) {
    try {
      let query = supabase
        .from('order')
        .select(`
          id,
          total_price,
          status,
          created_at,
          updated_at,
          shipping_address,
          order_items (
            id,
            quantity,
            price_at_purchase,
            product:product_id (
              id,
              name,
              description,
              price,
              images,
              seller:seller_id (
                id,
                username,
                full_name
              )
            )
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const { data: orders, error } = await query;

      if (error) throw error;

      // Apply status filter if provided
      if (statusFilter) {
        return orders.filter(order => order.status === statusFilter);
      }

      return orders || [];
    } catch (error) {
      console.error('Error fetching buyer orders:', error);
      throw error;
    }
  }
};