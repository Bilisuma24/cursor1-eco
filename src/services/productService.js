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
      
      const response = await fetch(`${supabaseUrl}/rest/v1/product?seller_id=eq.${sellerId}&order=created_at.desc`, {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('REST API fetch error:', response.status, errorText);
        throw new Error(`Failed to fetch products: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Fetched products:', data.length);
      return data;
    } catch (error) {
      console.error('Error fetching seller products:', error);
      throw error;
    }
  },

  // Create a new product - DIRECT REST API WITH SESSION TOKEN
  async createProduct(productData) {
    try {
      console.log('========== PRODUCT CREATION START ==========');
      console.log('Creating product with data:', JSON.stringify(productData, null, 2));
      
      const supabaseUrl = 'https://azvslusinlvnjymaufhw.supabase.co';
      const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6dnNsdXNpbmx2bmp5bWF1Zmh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NjYwNjYsImV4cCI6MjA3NTU0MjA2Nn0.4MdiznfE-UOdDn25X8XocML44UrCxpsJ2fIgvULevnw';
      
      // Get session token from localStorage (Supabase stores it there)
      let authToken = supabaseKey;
      try {
        // Supabase stores session in localStorage with key pattern: sb-<project-ref>-auth-token
        // Check multiple possible keys
        const possibleKeys = [
          'sb-azvslusinlvnjymaufhw-auth-token',
          ...Object.keys(localStorage).filter(key => key.includes('supabase') && key.includes('auth'))
        ];
        
        for (const sessionKey of possibleKeys) {
          const sessionData = localStorage.getItem(sessionKey);
          if (sessionData) {
            try {
              const session = JSON.parse(sessionData);
              // Check if it's the current session format
              if (session?.access_token) {
                authToken = session.access_token;
                console.log('Found session token in localStorage:', sessionKey);
                break;
              }
              // Or check if it's the state format
              if (session?.state?.access_token) {
                authToken = session.state.access_token;
                console.log('Found session token in localStorage (state format):', sessionKey);
                break;
              }
            } catch (e) {
              // Continue to next key
            }
          }
        }
      } catch (e) {
        console.warn('Could not get session from localStorage:', e);
      }
      
      // Fallback: try to get session from Supabase client (but with timeout)
      if (authToken === supabaseKey) {
        try {
          const sessionTimeout = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Session timeout')), 2000);
          });
          const sessionPromise = supabase.auth.getSession();
          const { data: { session } } = await Promise.race([sessionPromise, sessionTimeout]);
          if (session?.access_token) {
            authToken = session.access_token;
            console.log('Got session token from Supabase client');
          }
        } catch (e) {
          console.warn('Could not get session from Supabase client:', e.message);
        }
      }
      
      console.log('Using auth token:', authToken.substring(0, 20) + '...');
      console.log('Making REST API request...');
      
      const startTime = Date.now();
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

      const endTime = Date.now();
      console.log(`Request completed in ${endTime - startTime}ms`);
      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('REST API error response:', errorText);
        
        let errorObj;
        try {
          errorObj = JSON.parse(errorText);
        } catch (e) {
          errorObj = { message: errorText };
        }
        
        throw new Error(`Database error (${response.status}): ${errorObj.message || errorText}`);
      }

      console.log('========== PRODUCT CREATED SUCCESSFULLY ==========');
      return { success: true };
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
      const { data, error } = await supabase
        .from('product')
        .update(productData)
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
