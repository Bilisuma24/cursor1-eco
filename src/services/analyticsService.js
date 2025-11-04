import { supabase } from '../lib/supabaseClient';

export const analyticsService = {
  // Get seller statistics (simplified version without RPC functions)
  async getSellerStats(sellerId) {
    try {
      // Get total products count
      const { count: totalProducts, error: productsError } = await supabase
        .from('product')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', sellerId);

      if (productsError) throw productsError;

      // Get total revenue from order items
      const { data: orderItems, error: revenueError } = await supabase
        .from('order_items')
        .select(`
          price_at_purchase,
          quantity,
          product!inner(
            seller_id
          )
        `)
        .eq('product.seller_id', sellerId);

      if (revenueError) throw revenueError;

      const totalRevenue = orderItems?.reduce((sum, item) => 
        sum + (item.price_at_purchase * item.quantity), 0) || 0;

      // Get orders count
      const { data: orders, error: ordersError } = await supabase
        .from('order')
        .select(`
          id,
          status,
          order_items!inner(
            product!inner(
              seller_id
            )
          )
        `)
        .eq('order_items.product.seller_id', sellerId);

      if (ordersError) throw ordersError;

      const ordersByStatus = {
        pending: 0,
        confirmed: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0
      };

      orders?.forEach(order => {
        if (ordersByStatus.hasOwnProperty(order.status)) {
          ordersByStatus[order.status]++;
        }
      });

      const totalOrders = Object.values(ordersByStatus).reduce((sum, count) => sum + count, 0);

      return {
        totalProducts: totalProducts || 0,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalOrders,
        pendingOrders: ordersByStatus.pending,
        confirmedOrders: ordersByStatus.confirmed,
        shippedOrders: ordersByStatus.shipped,
        deliveredOrders: ordersByStatus.delivered,
        cancelledOrders: ordersByStatus.cancelled,
        ordersByStatus // Keep for backwards compatibility
      };
    } catch (error) {
      console.error('Error fetching seller stats:', error);
      throw error;
    }
  },

  // Get sales data for charts
  async getSalesData(sellerId, dateRange = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);

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

      const { data, error } = await supabase
        .from('order_items')
        .select(`
          price_at_purchase,
          quantity,
          created_at,
          order:order_id (
            created_at
          )
        `)
        .gte('created_at', startDate.toISOString())
        .in('product_id', productIds);

      if (error) throw error;

      // Group by date and calculate daily revenue
      const dailySales = {};
      data.forEach(item => {
        if (item.order && item.order.created_at) {
          const date = new Date(item.order.created_at).toISOString().split('T')[0];
          if (!dailySales[date]) {
            dailySales[date] = 0;
          }
          dailySales[date] += item.price_at_purchase * item.quantity;
        }
      });

      // Convert to array format for charts
      const salesData = Object.entries(dailySales).map(([date, revenue]) => ({
        date,
        revenue: parseFloat(revenue.toFixed(2))
      }));

      return salesData.sort((a, b) => new Date(a.date) - new Date(b.date));
    } catch (error) {
      console.error('Error fetching sales data:', error);
      throw error;
    }
  },

  // Get top selling products
  async getTopProducts(sellerId, limit = 5) {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          product_id,
          quantity,
          price_at_purchase,
          product!inner(
            id,
            name,
            image_url,
            price,
            seller_id
          )
        `)
        .eq('product.seller_id', sellerId);

      if (error) throw error;

      // Group by product and calculate total quantity sold and revenue
      const productSales = {};
      data.forEach(item => {
        const productId = item.product_id;
        if (!productSales[productId]) {
          productSales[productId] = {
            product: { ...item.product },
            totalQuantity: 0,
            totalRevenue: 0
          };
        }
        productSales[productId].totalQuantity += item.quantity;
        productSales[productId].totalRevenue += item.price_at_purchase * item.quantity;
      });

      // Convert to array and sort by total quantity sold
      const topProducts = Object.values(productSales)
        .sort((a, b) => b.totalQuantity - a.totalQuantity)
        .slice(0, limit);

      return topProducts;
    } catch (error) {
      console.error('Error fetching top products:', error);
      throw error;
    }
  },

  // Get recent orders
  async getRecentOrders(sellerId, limit = 10) {
    try {
      const { data, error } = await supabase
        .from('order')
        .select(`
          id,
          status,
          total_price,
          created_at,
          order_items!inner(
            product!inner(
              seller_id
            )
          )
        `)
        .eq('order_items.product.seller_id', sellerId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      throw error;
    }
  }
};