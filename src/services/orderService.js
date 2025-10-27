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
            product_id
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

      // Apply status filter if provided
      if (statusFilter) {
        return sellerOrders.filter(order => order.status === statusFilter);
      }

      return sellerOrders;
    } catch (error) {
      console.error('Error fetching seller orders:', error);
      throw error;
    }
  },

  // Get recent orders for dashboard
  async getRecentOrders(sellerId, limit = 5) {
    try {
      const orders = await this.fetchSellerOrders(sellerId);
      return orders.slice(0, limit);
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
  }
};