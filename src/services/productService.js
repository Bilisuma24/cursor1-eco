import { supabase } from '../lib/supabaseClient';

export const productService = {
  // Fetch all products for a specific seller
  async fetchSellerProducts(sellerId) {
    try {
      const { data, error } = await supabase
        .from('product')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching seller products:', error);
      throw error;
    }
  },

  // Create a new product
  async createProduct(productData, images = []) {
    try {
      const { data, error } = await supabase
        .from('product')
        .insert([{
          ...productData,
          images: images
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  // Update an existing product
  async updateProduct(productId, productData, images = null) {
    try {
      const updateData = { ...productData };
      if (images !== null) {
        updateData.images = images;
      }

      const { data, error } = await supabase
        .from('product')
        .update(updateData)
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  // Delete a product
  async deleteProduct(productId) {
    try {
      const { error } = await supabase
        .from('product')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  // Upload product images to Supabase Storage
  async uploadProductImages(files, productId) {
    try {
      // Filter out only actual file objects (not existing images)
      const actualFiles = files.filter(file => file.file && file.name);
      
      if (actualFiles.length === 0) {
        return [];
      }

      const uploadPromises = actualFiles.map(async (fileObj, index) => {
        const file = fileObj.file;
        
        // Debug logging
        console.log('Processing file:', file);
        console.log('File name:', file?.name);
        console.log('File type:', typeof file);
        
        // Validate file object
        if (!file) {
          throw new Error(`File object is undefined at index ${index}`);
        }
        
        if (!file.name) {
          throw new Error(`File name is undefined at index ${index}. File object:`, file);
        }
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${productId}/${Date.now()}-${index}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(fileName, file);

        if (error) throw error;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        return publicUrl;
      });

      const imageUrls = await Promise.all(uploadPromises);
      return imageUrls;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  },

  // Delete a product image from storage
  async deleteProductImage(imagePath) {
    try {
      // Extract file path from URL
      const url = new URL(imagePath);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const productId = pathParts[pathParts.length - 2];
      const fullPath = `${productId}/${fileName}`;

      const { error } = await supabase.storage
        .from('product-images')
        .remove([fullPath]);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  },

  // Get product categories
  async getCategories() {
    try {
      const { data, error } = await supabase
        .from('product')
        .select('category')
        .not('category', 'is', null);

      if (error) throw error;
      
      // Extract unique categories
      const categories = [...new Set(data.map(item => item.category))];
      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  // Search products by seller
  async searchSellerProducts(sellerId, searchTerm, category = null) {
    try {
      let query = supabase
        .from('product')
        .select('*')
        .eq('seller_id', sellerId);

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }
};
