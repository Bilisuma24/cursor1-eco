import { supabase } from '../lib/supabaseClient';

export const priceAlertService = {
  // Create a new price alert
  async createPriceAlert(userId, productId, targetPrice, currentPrice) {
    try {
      const { data, error } = await supabase
        .from('price_alerts')
        .insert({
          user_id: userId,
          product_id: productId,
          target_price: parseFloat(targetPrice),
          current_price: parseFloat(currentPrice),
          is_active: true,
          is_notified: false,
        })
        .select()
        .single();

      if (error) {
        // Handle duplicate key error - means alert already exists
        if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
          // Try to update existing alert instead
          const updateResult = await this.updatePriceAlert(null, {
            user_id: userId,
            product_id: productId,
            target_price: parseFloat(targetPrice),
            current_price: parseFloat(currentPrice),
            is_active: true,
            is_notified: false,
          });
          return updateResult;
        }
        // Handle table not found
        if (error.code === 'PGRST205' || error.status === 406) {
          return { 
            success: false, 
            error: 'Price alerts feature not set up. Please run the SQL migration first.' 
          };
        }
        throw error;
      }
      return { success: true, data };
    } catch (error) {
      console.error('Error creating price alert:', error);
      return { success: false, error: error.message || 'Failed to create price alert' };
    }
  },

  // Update an existing price alert
  async updatePriceAlert(alertId, updates) {
    try {
      let query = supabase.from('price_alerts').update(updates);
      
      if (alertId) {
        query = query.eq('id', alertId);
      } else if (updates.user_id && updates.product_id) {
        // Update by user_id and product_id if alertId not provided
        query = query.eq('user_id', updates.user_id).eq('product_id', updates.product_id);
      } else {
        throw new Error('Must provide alertId or user_id + product_id');
      }

      const { data, error } = await query.select().single();

      if (error) {
        if (error.code === 'PGRST205' || error.status === 406) {
          return { 
            success: false, 
            error: 'Price alerts feature not set up. Please run the SQL migration first.' 
          };
        }
        throw error;
      }
      return { success: true, data };
    } catch (error) {
      console.error('Error updating price alert:', error);
      return { success: false, error: error.message || 'Failed to update price alert' };
    }
  },

  // Get all price alerts for a user
  async getUserPriceAlerts(userId) {
    try {
      const { data, error } = await supabase
        .from('price_alerts')
        .select(`
          *,
          product (
            id,
            name,
            price,
            images,
            image_url
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        // Handle 406 Not Acceptable (table doesn't exist)
        if (error.code === 'PGRST205' || error.status === 406 || error.message?.includes('Not Acceptable')) {
          return { success: true, data: [] };
        }
        throw error;
      }
      return { success: true, data: data || [] };
    } catch (error) {
      // Check if it's a 406 error from the network request
      if (error?.status === 406 || error?.message?.includes('Not Acceptable') || error?.code === 'PGRST205') {
        return { success: true, data: [] };
      }
      console.error('Error fetching price alerts:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  // Get active price alerts for a user
  async getActivePriceAlerts(userId) {
    try {
      const { data, error } = await supabase
        .from('price_alerts')
        .select(`
          *,
          product (
            id,
            name,
            price,
            images,
            image_url
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        // Handle 406 Not Acceptable (table doesn't exist)
        if (error.code === 'PGRST205' || error.status === 406 || error.message?.includes('Not Acceptable')) {
          return { success: true, data: [] };
        }
        throw error;
      }
      return { success: true, data: data || [] };
    } catch (error) {
      // Check if it's a 406 error from the network request
      if (error?.status === 406 || error?.message?.includes('Not Acceptable') || error?.code === 'PGRST205') {
        return { success: true, data: [] };
      }
      console.error('Error fetching active price alerts:', error);
      return { success: false, error: error.message, data: [] };
    }
  },

  // Get price alert for a specific product
  async getProductAlert(userId, productId) {
    try {
      const { data, error } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .maybeSingle(); // Use maybeSingle() instead of single() to avoid errors when no row found

      // PGRST116 = no rows found (this is OK)
      // PGRST205/406 = table doesn't exist or schema issue (gracefully handle)
      if (error) {
        if (error.code === 'PGRST116') {
          return { success: true, data: null, tableExists: true };
        }
        // Handle 406 Not Acceptable (table doesn't exist) or PGRST205
        if (error.code === 'PGRST205' || error.status === 406 || error.message?.includes('Not Acceptable')) {
          // Table doesn't exist yet - return flag to indicate this (don't log as error)
          return { success: true, data: null, tableExists: false };
        }
        // Only log other errors
        console.error('Error fetching product alert:', error);
        return { success: true, data: null, tableExists: true };
      }
      return { success: true, data: data || null, tableExists: true };
    } catch (error) {
      // Check if it's a 406 error from the network request
      if (error?.status === 406 || error?.message?.includes('Not Acceptable') || error?.code === 'PGRST205') {
        // Return a special flag to indicate table doesn't exist (don't log as error)
        return { success: true, data: null, tableExists: false };
      }
      // Only log unexpected errors
      console.error('Error fetching product alert:', error);
      return { success: true, data: null, tableExists: true };
    }
  },

  // Delete a price alert
  async deletePriceAlert(alertId) {
    try {
      const { error } = await supabase
        .from('price_alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting price alert:', error);
      return { success: false, error: error.message };
    }
  },

  // Toggle alert active status
  async toggleAlertStatus(alertId, isActive) {
    try {
      const { data, error } = await supabase
        .from('price_alerts')
        .update({ is_active: isActive })
        .eq('id', alertId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error toggling alert status:', error);
      return { success: false, error: error.message };
    }
  },

  // Mark alert as notified (for after sending notification)
  async markAsNotified(alertId) {
    try {
      const { data, error } = await supabase
        .from('price_alerts')
        .update({ 
          is_notified: true,
          notified_at: new Date().toISOString()
        })
        .eq('id', alertId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error marking alert as notified:', error);
      return { success: false, error: error.message };
    }
  },
};

