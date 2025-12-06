import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { productService } from '../../services/productService';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Eye, Package } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const Products = () => {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadProducts();
    }
    loadCategories();
  }, [user]);

  const loadProducts = async () => {
    if (!user?.id) {
      console.log('User not available yet, skipping product load');
      return;
    }
    
    try {
      setLoading(true);
      const data = await productService.fetchSellerProducts(user.id);
      setProducts(data);
    } catch (err) {
      setError('Failed to load products');
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await productService.getCategories();
      setCategories(cats);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const handleDelete = async (productId, productName) => {
    if (!window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await productService.deleteProduct(productId);
      setProducts(products.filter(p => p.id !== productId));
    } catch (err) {
      setError('Failed to delete product');
      console.error('Error deleting product:', err);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStockStatus = (stock) => {
    if (stock === 0) return { text: 'Out of Stock', color: 'text-red-600 bg-red-100' };
    if (stock < 10) return { text: 'Low Stock', color: 'text-yellow-600 bg-yellow-100' };
    return { text: 'In Stock', color: 'text-green-600 bg-green-100' };
  };

  // Helper function to convert image paths to public URLs
  const convertToPublicUrl = (imagePath) => {
    if (!imagePath || typeof imagePath !== 'string') {
      return null;
    }
    
    // If it's already a full URL (http/https), return as-is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // If it's a relative path, convert to public URL
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">
              Products
            </h1>
            <p className="text-sm text-gray-500">
              Manage your product inventory ({filteredProducts.length} products)
            </p>
          </div>
          <Link
            to="/seller-dashboard/products/new"
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl shadow-sm">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
        <div className="sm:w-40">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-8 inline-block mb-6">
            <Package className="h-16 w-16 text-gray-400 mx-auto" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {searchTerm || selectedCategory ? 'No products found' : 'No products yet'}
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {searchTerm || selectedCategory 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by adding your first product to your store'
            }
          </p>
          {!searchTerm && !selectedCategory && (
            <Link
              to="/seller-dashboard/products/new"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:via-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 font-semibold transform hover:scale-[1.02]"
            >
              <Plus className="h-5 w-5" />
              <span>Add Your First Product</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock);
                  const rawMainImage = product.images && product.images.length > 0 
                    ? product.images[0] 
                    : product.image_url;
                  const mainImage = rawMainImage ? convertToPublicUrl(rawMainImage) : null;

                  return (
              <div key={product.id} className="bg-white border border-gray-200 rounded-xl p-3 hover:shadow-md transition-shadow">
                <div className="flex gap-3">
                  {/* Product Image - Much Smaller */}
                  <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                    {mainImage ? (
                      <img
                        className="w-full h-full object-cover"
                        src={mainImage}
                        alt={product.name}
                        onError={(e) => {
                          e.target.src = '';
                          e.target.style.display = 'none';
                          e.target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full flex items-center justify-center bg-gray-100 ${mainImage ? 'hidden' : ''}`}>
                      <Package className="h-6 w-6 text-gray-400" />
                    </div>
                    {/* Stock Badge */}
                    <div className="absolute top-1 right-1">
                      <span className={`inline-flex px-1 py-0.5 text-[10px] font-medium rounded ${stockStatus.color}`}>
                        {stockStatus.text}
                      </span>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2 line-clamp-1">
                      {product.description || 'No description'}
                    </p>
                    
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="text-base font-bold text-gray-900">
                          ${product.price.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Stock: {product.stock}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/product/${product.id}`}
                        className="flex items-center justify-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-medium transition-colors"
                        title="View Product"
                      >
                        <Eye className="h-3 w-3" />
                      </Link>
                      <Link
                        to={`/seller-dashboard/products/${product.id}/edit`}
                        className="flex items-center justify-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors"
                        title="Edit Product"
                      >
                        <Edit className="h-3 w-3" />
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id, product.name)}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-colors"
                        title="Delete Product"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
                  );
                })}
        </div>
      )}
    </div>
  );
};

export default Products;
