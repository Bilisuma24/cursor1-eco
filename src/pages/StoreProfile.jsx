import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Star, ShoppingBag, Users, Package, ArrowLeft, MessageCircle, CheckCircle } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import ProductCard from "../components/ProductCard";

export default function StoreProfile() {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const [storeInfo, setStoreInfo] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (sellerId) {
      loadStoreProfile();
      loadStoreProducts();
    }
  }, [sellerId]);

  const loadStoreProfile = async () => {
    try {
      // Fetch seller profile from database
      const { data: profile, error: profileError } = await supabase
        .from('profile')
        .select('*')
        .eq('user_id', sellerId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
        setError('Store not found');
        return;
      }

      // Get store name - prioritize full_name, then username, then fallback
      const storeName = profile?.full_name || 
                        profile?.username || 
                        `Store ${sellerId.substring(0, 8)}`;

      setStoreInfo({
        id: sellerId,
        name: storeName,
        avatar: profile?.avatar_url || null,
        verified: !!profile,
        rating: 4.5, // Can be calculated from reviews later
        followers: 0, // Can be added later
        description: profile?.bio || 'Welcome to our store!',
        joinedDate: profile?.created_at || new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error loading store profile:', err);
      setError('Failed to load store information');
    }
  };

  const loadStoreProducts = async () => {
    try {
      setLoading(true);
      
      // Fetch all products from this seller
      const { data: storeProducts, error: productsError } = await supabase
        .from('product')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (productsError) {
        console.error('Error fetching products:', productsError);
        setProducts([]);
        return;
      }

      // Transform database products to match ProductCard format
      const transformedProducts = (storeProducts || []).map(product => {
        // Helper function to convert image paths to public URLs
        const convertToPublicUrl = (imagePath) => {
          if (!imagePath || typeof imagePath !== 'string') {
            return null;
          }
          
          if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
          }
          
          const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
          
          try {
            const { data } = supabase.storage
              .from('product-images')
              .getPublicUrl(cleanPath);
            return data?.publicUrl || null;
          } catch (err) {
            console.warn('Error converting image path to URL:', cleanPath, err);
            return null;
          }
        };

        // Handle images
        let imageArray = [];
        if (product.images && Array.isArray(product.images) && product.images.length > 0) {
          imageArray = product.images.filter(img => img != null && img !== '');
        } else if (product.image_url) {
          if (Array.isArray(product.image_url)) {
            imageArray = product.image_url.filter(img => img != null && img !== '');
          } else if (typeof product.image_url === 'string' && product.image_url.trim()) {
            imageArray = [product.image_url];
          }
        }

        const convertedImages = imageArray
          .map(img => {
            if (typeof img === 'string' && img.trim()) {
              const trimmed = img.trim();
              if (trimmed.includes('via.placeholder.com')) {
                return null;
              }
              if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image')) {
                return trimmed;
              }
              const publicUrl = convertToPublicUrl(trimmed);
              if (publicUrl && (publicUrl.startsWith('http://') || publicUrl.startsWith('https://'))) {
                return publicUrl;
              }
              return null;
            }
            return null;
          })
          .filter(img => {
            if (typeof img === 'string' && img.trim().length > 0) {
              const trimmed = img.trim();
              return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image');
            }
            return false;
          });

        // Default placeholder if no images
        const defaultImage = convertedImages.length > 0 
          ? convertedImages 
          : [`data:image/svg+xml;base64,${btoa(`<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="#f3f4f6"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="18" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>`)}`];

        return {
          id: product.id,
          name: product.name || 'Untitled Product',
          description: product.description || '',
          price: parseFloat(product.price) || 0,
          currency: product.currency || 'ETB',
          images: defaultImage,
          category: product.category || 'General',
          rating: product.rating || 4.0,
          reviewCount: product.review_count || 0,
          sold: product.sold || 0,
          stock: product.stock || 0,
          originalPrice: product.original_price || null,
          discount: product.discount || null,
          colors: product.colors && Array.isArray(product.colors) && product.colors.length > 0 ? product.colors : null,
          sizes: product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes : null,
          isFromDatabase: true,
        };
      });

      setProducts(transformedProducts);
    } catch (err) {
      console.error('Error loading store products:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !storeInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading store...</p>
        </div>
      </div>
    );
  }

  if (error || !storeInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error || 'Store not found'}</p>
          <button
            onClick={() => navigate('/shop')}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  const storeInitial = storeInfo.name.charAt(0).toUpperCase();
  const totalProducts = products.length;
  const totalSold = products.reduce((sum, p) => sum + (p.sold || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          {/* Store Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {storeInfo.avatar ? (
              <img
                src={storeInfo.avatar}
                alt={storeInfo.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white font-bold flex items-center justify-center text-2xl">
                {storeInitial}
              </div>
            )}
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{storeInfo.name}</h1>
                {storeInfo.verified && (
                  <CheckCircle className="w-5 h-5 text-blue-500" />
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  {storeInfo.rating.toFixed(1)}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {storeInfo.followers}+ followers
                </span>
                <span className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  {totalProducts} products
                </span>
              </div>
              {storeInfo.description && (
                <p className="text-gray-600 text-sm">{storeInfo.description}</p>
              )}
            </div>

            <button
              onClick={() => navigate('/contact')}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Contact Store</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
              <p className="text-sm text-gray-600">Products</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{totalSold}</p>
              <p className="text-sm text-gray-600">Items Sold</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{storeInfo.rating.toFixed(1)}</p>
              <p className="text-sm text-gray-600">Store Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Store Products</h2>
          <span className="text-sm text-gray-600">{totalProducts} product{totalProducts !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No products available</p>
            <p className="text-sm text-gray-500">This store hasn't added any products yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

