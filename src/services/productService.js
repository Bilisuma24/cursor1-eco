import { supabase } from '../lib/supabaseClient';

export const productService = {
  // Test database connection
  // Test database connection
  async testConnection() {
    try {
      console.log('Testing database connection...');
      console.log('Supabase client available:', !!supabase);
      
      // First try a simple query
      console.log('Attempting simple count query...');
      const startTime = Date.now();
      
      const { data, error } = await supabase
        .from('product')
        .select('count')
        .limit(1);
      
      const endTime = Date.now();
      console.log(`Query completed in ${endTime - startTime}ms`);
      
      if (error) {
        console.error('Database connection test failed:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw error;
      }
      
      console.log('Database connection test successful, data:', data);
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
  },

  // Fetch all products for a specific seller - REST API
  async fetchSellerProducts(sellerId) {
    try {
      console.log('Fetching seller products for:', sellerId);
      
      const supabaseUrl = 'https://azvslusinlvnjymaufhw.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6dnNsdXNpbmx2bmp5bWF1Zmh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NjYwNjYsImV4cCI6MjA3NTU0MjA2Nn0.4MdiznfE-UOdDn25X8XocML44UrCxpsJ2fIgvULevnw';
      
      // Get session token
      let authToken = supabaseKey;
      try {
        const possibleKeys = [
          'sb-azvslusinlvnjymaufhw-auth-token',
          ...Object.keys(localStorage).filter(key => key.includes('supabase') && key.includes('auth'))
        ];
        
        for (const sessionKey of possibleKeys) {
          const sessionData = localStorage.getItem(sessionKey);
          if (sessionData) {
            try {
              const session = JSON.parse(sessionData);
              if (session?.access_token) {
                authToken = session.access_token;
                console.log('Found session token for fetch');
                break;
              }
              if (session?.state?.access_token) {
                authToken = session.state.access_token;
                console.log('Found session token for fetch (state format)');
                break;
              }
            } catch (e) {
              // Continue to next key
            }
          }
        }
      } catch (e) {
        console.warn('Could not get session from localStorage for fetch:', e);
      }
      
      // Explicitly select all columns including images
      const response = await fetch(`${supabaseUrl}/rest/v1/product?seller_id=eq.${sellerId}&order=created_at.desc&select=*`, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json',
          'Prefer': 'return=representation'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('REST API fetch error:', response.status, errorText);
        throw new Error(`Failed to fetch products: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Fetched products:', data.length);
      
      // Log first product's image data for debugging
      if (data.length > 0) {
        console.log('Sample product image data:', {
          id: data[0].id,
          name: data[0].name,
          images: data[0].images,
          image_url: data[0].image_url,
          imagesType: typeof data[0].images,
          imagesIsArray: Array.isArray(data[0].images)
        });
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching seller products:', error);
      throw error;
    }
  },

  // Create a new product - USING SUPABASE CLIENT (more reliable)
  async createProduct(productData) {
    try {
      console.log('========== PRODUCT CREATION START ==========');
      console.log('Creating product with data:', JSON.stringify(productData, null, 2));
      
      // CRITICAL: Get seller_id from multiple sources to ensure it's set
      let sellerId = productData.seller_id;
      
      // If seller_id is missing, try to get it from Supabase session
      if (!sellerId) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.id) {
            sellerId = session.user.id;
            console.log('⚠️ seller_id was missing, got from session:', sellerId);
          }
        } catch (sessionError) {
          console.error('Could not get session for seller_id:', sessionError);
        }
      }
      
      // Verify seller_id is present
      if (!sellerId) {
        throw new Error('seller_id is required to create a product. Please make sure you are logged in.');
      }
      
      // Remove null/undefined/empty array fields to avoid schema errors
      const cleanedData = { ...productData };
      
      // CRITICAL: Always ensure seller_id is set (don't let it be removed)
      cleanedData.seller_id = sellerId;
      
      // Only include colors if it's a non-empty array
      if (!cleanedData.colors || cleanedData.colors.length === 0) {
        delete cleanedData.colors;
      }
      
      // Only include sizes if it's a non-empty array
      if (!cleanedData.sizes || cleanedData.sizes.length === 0) {
        delete cleanedData.sizes;
      }
      
      // Only include gender if it has a value
      if (!cleanedData.gender) {
        delete cleanedData.gender;
      }
      
      // Only include shipping_cost if it's not null
      if (cleanedData.shipping_cost === null || cleanedData.shipping_cost === undefined) {
        delete cleanedData.shipping_cost;
      }
      
      // Remove express_shipping if it doesn't exist in schema (temporary fix)
      // TODO: Add express_shipping column to database or remove from form
      if ('express_shipping' in cleanedData) {
        // Keep it only if we're sure the column exists, otherwise remove it
        // For now, we'll remove it to avoid schema errors
        delete cleanedData.express_shipping;
      }
      
      // Ensure images is an array (not null)
      if (!cleanedData.images || !Array.isArray(cleanedData.images)) {
        cleanedData.images = cleanedData.images ? [cleanedData.images] : [];
      }
      
      // CRITICAL: Double-check seller_id is still present after cleaning
      if (!cleanedData.seller_id) {
        cleanedData.seller_id = sellerId;
        console.log('⚠️ seller_id was removed during cleaning, restored:', sellerId);
      }
      
      console.log('Cleaned product data (with seller_id):', JSON.stringify(cleanedData, null, 2));
      console.log('🔍 VERIFICATION - seller_id in cleanedData:', cleanedData.seller_id);
      
      // Verify we have an authenticated session (with retry for timing issues)
      let currentSession = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (session) {
          currentSession = session;
          break;
        }
        if (attempt < 2) {
          console.log(`⚠️ Session not found, retrying... (attempt ${attempt + 1}/3)`);
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms before retry
        }
      }
      
      if (!currentSession) {
        // If no session but we have seller_id, try to proceed anyway (RLS will handle auth)
        if (!cleanedData.seller_id) {
          throw new Error('No authenticated session found. Please log in again.');
        }
        console.warn('⚠️ No session found, but seller_id is present. Proceeding with insert...');
      } else {
        console.log('✅ Authenticated session verified. User ID:', currentSession.user.id);
        console.log('✅ seller_id to be inserted:', cleanedData.seller_id);
        console.log('✅ Session user ID matches seller_id:', currentSession.user.id === cleanedData.seller_id);
      }
      
      // Use Supabase client directly (more reliable than REST API)
      console.log('Using Supabase client to insert product...');
      const { data, error } = await supabase
        .from('product')
        .insert([cleanedData])
        .select()
        .single();

      if (error) {
        console.error('========== SUPABASE INSERT ERROR ==========');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        console.error('Error hint:', error.hint);
        
        // If RLS error, provide helpful message
        if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
          throw new Error(`Permission denied: ${error.message}. Make sure RLS policies allow sellers to insert products with their seller_id.`);
        }
        
        throw new Error(`Database error: ${error.message || error.code}`);
      }

      console.log('========== PRODUCT CREATED SUCCESSFULLY ==========');
      console.log('Created product:', data);
      console.log('🔍 VERIFICATION - Created product seller_id:', data?.seller_id);
      
      // Verify the product was created with seller_id
      if (!data?.seller_id) {
        console.error('❌ CRITICAL: Product was created but seller_id is NULL!');
        throw new Error('Product was created but seller_id was not saved. This is a database issue.');
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('========== PRODUCT CREATION FAILED ==========');
      console.error('Error creating product:', error);
      console.error('Error message:', error.message);
      throw error;
    }
  },

  // Create product via REST API directly (fallback method)
  async createProductViaREST(productData) {
    try {
      console.log('========== USING REST API FALLBACK ==========');
      const supabaseUrl = 'https://azvslusinlvnjymaufhw.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6dnNsdXNpbmx2bmp5bWF1Zmh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NjYwNjYsImV4cCI6MjA3NTU0MjA2Nn0.4MdiznfE-UOdDn25X8XocML44UrCxpsJ2fIgvULevnw';
      
      // Get the current session token for authentication
      let authToken = supabaseKey;
      try {
        const sessionTimeout = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Session fetch timeout')), 2000);
        });
        
        const sessionPromise = supabase.auth.getSession();
        const { data: { session } } = await Promise.race([sessionPromise, sessionTimeout]);
        
        if (session?.access_token) {
          authToken = session.access_token;
          console.log('Using authenticated session token');
          
          // Ensure seller_id is included if we have a user
          if (session?.user?.id && !productData.seller_id) {
            productData = { ...productData, seller_id: session.user.id };
            console.log('Added seller_id from session:', session.user.id);
          }
        } else {
          console.warn('No active session found, using anon key');
        }
      } catch (sessionError) {
        console.warn('Could not get session (timeout or error), using anon key:', sessionError.message);
        // Continue with anon key - might fail due to RLS but we'll try
      }
      
      console.log('Making REST API request to:', `${supabaseUrl}/rest/v1/product`);
      console.log('With data:', JSON.stringify(productData, null, 2));
      
      const response = await fetch(`${supabaseUrl}/rest/v1/product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${authToken}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify(productData)
      });

      console.log('REST API response status:', response.status);
      console.log('REST API response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('REST API error response:', errorText);
        throw new Error(`REST API error: ${response.status} - ${errorText}`);
      }

      console.log('Product created successfully via REST API!');
      return { success: true };
    } catch (error) {
      console.error('REST API creation failed:', error);
      throw error;
    }
  },

  // Update an existing product
  async updateProduct(productId, productData) {
    try {
      console.log('Updating product with data:', productData);
      
      // Remove null/undefined/empty array fields to avoid schema errors
      const cleanedData = { ...productData };
      
      // Only include colors if it's a non-empty array
      if (!cleanedData.colors || cleanedData.colors.length === 0) {
        delete cleanedData.colors;
      }
      
      // Only include sizes if it's a non-empty array
      if (!cleanedData.sizes || cleanedData.sizes.length === 0) {
        delete cleanedData.sizes;
      }
      
      // Only include gender if it has a value
      if (!cleanedData.gender) {
        delete cleanedData.gender;
      }
      
      // Only include shipping_cost if it's not null
      if (cleanedData.shipping_cost === null || cleanedData.shipping_cost === undefined) {
        delete cleanedData.shipping_cost;
      }
      
      console.log('Cleaned update data (null/empty fields removed):', cleanedData);
      
      const { data, error } = await supabase
        .from('product')
        .update(cleanedData)
        .eq('id', productId)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error (initial):', error);
        // Fallback similar to create: drop unknown columns and retry
        const cleaned = { ...productData };
        let retried = false;
        if (error.message?.includes('images') || error.details?.includes('images')) {
          delete cleaned.images;
          retried = true;
        }
        if (error.message?.includes('seller_id') || error.details?.includes('seller_id')) {
          delete cleaned.seller_id;
          retried = true;
        }
        if (retried) {
          console.warn('Retrying updateProduct without unavailable columns:', Object.keys(productData).filter(k => !(k in cleaned)));
          const { data: retryData, error: retryError } = await supabase
            .from('product')
            .update(cleaned)
            .eq('id', productId)
            .select()
            .single();
          if (retryError) {
            console.error('Supabase update error (retry):', retryError);
            throw retryError;
          }
          console.log('Product updated successfully on retry:', retryData);
          return retryData;
        }
        throw error;
      }
      console.log('Product updated successfully:', data);
      return data;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  // Delete a product
  async deleteProduct(productId) {
    try {
      console.log('deleteProduct called with ID:', productId);
      
      if (!productId) {
        throw new Error('Product ID is required');
      }

      // First, try to delete associated images from storage if they exist
      try {
        const { data: productData } = await supabase
          .from('product')
          .select('images, image_url')
          .eq('id', productId)
          .single();

        if (productData) {
          const imagesToDelete = [];
          
          // Collect all image paths
          if (productData.images && Array.isArray(productData.images)) {
            imagesToDelete.push(...productData.images);
          }
          if (productData.image_url) {
            if (Array.isArray(productData.image_url)) {
              imagesToDelete.push(...productData.image_url);
            } else {
              imagesToDelete.push(productData.image_url);
            }
          }

          // Delete images from storage (non-blocking - continue even if this fails)
          for (const imagePath of imagesToDelete) {
            if (imagePath && typeof imagePath === 'string' && !imagePath.startsWith('http')) {
              try {
                const pathParts = imagePath.split('/');
                const fileName = pathParts[pathParts.length - 1];
                await supabase.storage
                  .from('product-images')
                  .remove([fileName]);
              } catch (storageError) {
                console.warn('Failed to delete image from storage:', imagePath, storageError);
                // Continue with product deletion even if image deletion fails
              }
            }
          }
        }
      } catch (fetchError) {
        console.warn('Could not fetch product images for deletion:', fetchError);
        // Continue with product deletion
      }

      // Check if product is referenced in order_items (which has ON DELETE RESTRICT)
      const { data: orderItems, error: checkError } = await supabase
        .from('order_items')
        .select('id')
        .eq('product_id', productId)
        .limit(1);

      if (checkError) {
        console.warn('Could not check order_items:', checkError);
      }

      if (orderItems && orderItems.length > 0) {
        throw new Error('Cannot delete product: It is referenced in existing orders. Please contact an administrator.');
      }

      // Delete the product from database
      const { data, error } = await supabase
        .from('product')
        .delete()
        .eq('id', productId)
        .select();

      if (error) {
        console.error('Supabase delete error:', error);
        // Provide more helpful error messages
        if (error.code === '23503') {
          throw new Error('Cannot delete product: It is referenced in other records (orders, cart, etc.).');
        } else if (error.code === '42501') {
          throw new Error('Permission denied: You do not have permission to delete products. Please check your user role.');
        } else {
          throw new Error(error.message || 'Failed to delete product');
        }
      }

      console.log('Product deleted successfully:', data);
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  // Upload product images to Supabase Storage
  // folderKey can be productId (for edits) or userId (for new products)
  async uploadProductImages(files, folderKey) {
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
        const fileName = `${folderKey}/${Date.now()}-${index}.${fileExt}`;
        
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
      if (!imagePath || typeof imagePath !== 'string') {
        throw new Error('Invalid image path provided');
      }

      let fullPath;
      
      // Check if imagePath is already a storage path (not a full URL)
      if (!imagePath.startsWith('http://') && !imagePath.startsWith('https://')) {
        // It's already a path, use it directly
        const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
        fullPath = cleanPath;
      } else {
        // Extract file path from URL
        try {
          const url = new URL(imagePath);
          const pathParts = url.pathname.split('/');
          const fileName = pathParts[pathParts.length - 1];
          const productId = pathParts[pathParts.length - 2];
          fullPath = `${productId}/${fileName}`;
        } catch (urlError) {
          // If URL construction fails, try to extract path from the string
          console.warn('Failed to parse URL, attempting to extract path:', imagePath);
          // Try to extract path from common URL patterns
          const pathMatch = imagePath.match(/\/product-images\/(.+)$/);
          if (pathMatch && pathMatch[1]) {
            fullPath = pathMatch[1];
          } else {
            throw new Error(`Invalid image URL format: ${imagePath}`);
          }
        }
      }

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

  // Get product categories - STATIC DATA
  async getCategories() {
    try {
      // Return static categories instead of fetching from database
      const staticCategories = [
        'Electronics',
        'Fashion', 
        'Home & Garden',
        'Sports & Outdoors',
        'Health & Beauty'
      ];
      
      console.log('Returning static categories:', staticCategories);
      return staticCategories;
    } catch (error) {
      console.error('Error getting categories:', error);
      // Fallback to basic categories
      return ['Electronics', 'Fashion', 'Home & Garden', 'Sports & Outdoors', 'Health & Beauty'];
    }
  },

  // Search products by seller - REST API
  async searchSellerProducts(sellerId, searchTerm, category = null) {
    try {
      console.log('Searching products for seller:', sellerId, 'term:', searchTerm, 'category:', category);
      
      // For now, just fetch all products and filter client-side
      // This is simpler and avoids complex REST API query building
      const allProducts = await this.fetchSellerProducts(sellerId);
      
      let filteredProducts = allProducts;
      
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredProducts = filteredProducts.filter(product => 
          product.name?.toLowerCase().includes(term) || 
          product.description?.toLowerCase().includes(term)
        );
      }
      
      if (category) {
        filteredProducts = filteredProducts.filter(product => 
          product.category === category
        );
      }
      
      console.log('Search results:', filteredProducts.length);
      return filteredProducts;
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }
};
