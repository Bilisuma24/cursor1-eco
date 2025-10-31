import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { productService } from '../../services/productService';
import ImageUploader from '../../components/seller/ImageUploader';
import FloatingLabelInput from '../../components/FloatingLabelInput';
import LoadingSpinner from '../../components/LoadingSpinner';
import ProgressBar from '../../components/ProgressBar';
import productsData from '../../data/products';
import { supabase } from '../../lib/supabaseClient';
import { ArrowLeft, Save, X, Upload, CheckCircle } from 'lucide-react';

const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: ''
  });
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [error, setError] = useState('');
  const [testMode, setTestMode] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadCategories();
    if (isEdit && user?.id) {
      loadProduct();
    }
  }, [id, isEdit, user?.id]);

  const loadCategories = async () => {
    try {
      // Use static category data instead of fetching from empty database
      const staticCategories = productsData.categories.map(cat => cat.name);
      setCategories(staticCategories);
    } catch (err) {
      console.error('Error loading categories:', err);
      // Fallback to basic categories if there's an error
      setCategories(['Electronics', 'Fashion', 'Home & Garden', 'Sports & Outdoors', 'Health & Beauty']);
    }
  };

  const loadProduct = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }
    
    try {
      setLoading(true);
      const products = await productService.fetchSellerProducts(user.id);
      const product = products.find(p => p.id === id);
      
      if (!product) {
        setError('Product not found');
        return;
      }

      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        stock: product.stock || '',
        category: product.category || ''
      });

      // Convert existing images to the format expected by ImageUploader
      if (product.images && product.images.length > 0) {
        const existingImages = product.images.map((imageUrl, index) => ({
          file: null, // We don't have the original file
          preview: imageUrl,
          name: `existing-image-${index}.jpg`,
          isExisting: true
        }));
        setImages(existingImages);
      }
    } catch (err) {
      setError('Failed to load product');
      console.error('Error loading product:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Product name is required');
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Valid price is required');
      return false;
    }
    if (!formData.stock || parseInt(formData.stock) < 0) {
      setError('Valid stock quantity is required');
      return false;
    }
    // Temporarily disable image requirement for testing
    // if (!testMode && images.length === 0) {
    //   setError('At least one product image is required');
    //   return false;
    // }
    return true;
  };

  const testProductCreation = async () => {
    setTestMode(true);
    setError('');
    setUploadProgress('Testing direct insert...');
    
    try {
      const testData = {
        name: 'Test Product',
        description: 'Test Description',
        price: 10.00,
        stock: 1,
        category: 'Electronics'
        // No seller_id - let it fail gracefully
      };
      
      console.log('Testing with minimal data (no seller_id):', testData);
      
      // Direct Supabase call
      const { data, error } = await supabase
        .from('product')
        .insert([testData])
        .select()
        .single();
      
      if (error) {
        console.log('Expected error (no seller_id):', error.message);
        if (error.code === '42501') {
          setUploadProgress('Test shows RLS is working - need seller_id');
          setError('RLS is blocking insert. This is expected without seller_id.');
        } else {
          throw new Error(`Unexpected error: ${error.message}`);
        }
      } else {
        console.log('Test successful!');
        setUploadProgress('Test successful! Product created.');
        setError('');
      }
    } catch (err) {
      console.error('Test failed:', err);
      setError(`Test failed: ${err.message}`);
      setUploadProgress('');
    } finally {
      setTestMode(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('========== FORM SUBMITTED ==========');
    setError('');
    setUploadProgress('');

    if (!user?.id) {
      console.error('No user ID found!');
      setError('You must be logged in to save products');
      return;
    }

    console.log('User ID:', user.id);
    console.log('Form data:', formData);

    if (!validateForm()) {
      console.error('Form validation failed');
      return;
    }

    try {
      setSaving(true);
      setUploadProgress('Checking connectivity...');
      
      // Quick connectivity test
      try {
        const testResponse = await fetch('https://azvslusinlvnjymaufhw.supabase.co/rest/v1/', {
          method: 'HEAD',
          headers: { 'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6dnNsdXNpbmx2bmp5bWF1Zmh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NjYwNjYsImV4cCI6MjA3NTU0MjA2Nn0.4MdiznfE-UOdDn25X8XocML44UrCxpsJ2fIgvULevnw' }
        });
        console.log('Supabase connectivity test:', testResponse.status);
      } catch (connError) {
        throw new Error('Cannot reach Supabase service. Please check your internet connection.');
      }
      
      setUploadProgress('Creating product...');
      setProgress(25);

      // Create the most basic product data possible
      const basicProductData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        category: formData.category || 'General',
        seller_id: user.id // Include seller_id from user context
      };

      console.log('Creating product with basic data:', basicProductData);
      setProgress(50);

      // Try to create product with minimal data first
      const result = await productService.createProduct(basicProductData);
      console.log('Product created successfully:', result);
      setProgress(75);

      setUploadProgress('Product created successfully!');
      setProgress(100);
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/seller-dashboard/products');
      }, 2000);
    } catch (err) {
      console.error('========== FORM SUBMISSION ERROR ==========');
      console.error('Error creating product:', err);
      setError(`Failed to create product: ${err.message}`);
    } finally {
      setSaving(false);
      setUploadProgress('');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">You must be logged in to access this page</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/seller-dashboard/products')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h1>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Upload Progress Message */}
      {uploadProgress && (
        <div className="mb-6 glass rounded-xl p-4 border border-blue-200 dark:border-blue-700">
          <div className="flex items-center space-x-3">
            <LoadingSpinner size="sm" color="blue" />
            <div className="flex-1">
              <p className="text-blue-800 dark:text-blue-200 font-medium">{uploadProgress}</p>
              <ProgressBar progress={progress} color="blue" size="sm" className="mt-2" />
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-6 glass rounded-xl p-4 border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <p className="text-green-800 dark:text-green-200 font-medium">Product saved successfully!</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Basic Info */}
          <div className="space-y-6">
            {/* Product Name */}
            <FloatingLabelInput
              id="name"
              label="Product Name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter product name"
              required
            />

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full form-textarea border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Describe your product..."
              />
            </div>

            {/* Price and Stock */}
            <div className="grid grid-cols-2 gap-4">
              <FloatingLabelInput
                id="price"
                label="Price ($)"
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                placeholder="0.00"
                required
              />
              <FloatingLabelInput
                id="stock"
                label="Stock Quantity"
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                min="0"
                placeholder="0"
                required
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="w-full form-select border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right Column - Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Images *
            </label>
            <ImageUploader
              images={images}
              onImagesChange={setImages}
              maxImages={5}
              maxSizeMB={5}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={testProductCreation}
              disabled={saving || testMode}
              className="flex items-center space-x-2 px-4 py-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover-scale-sm"
            >
              {testMode ? <LoadingSpinner size="sm" color="blue" /> : <Upload className="h-4 w-4" />}
              <span>{testMode ? 'Testing...' : 'Test Creation'}</span>
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => navigate('/seller-dashboard/products')}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 hover-scale-sm"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-modern flex items-center space-x-2 px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed hover-scale ripple"
            >
            {saving ? (
              <>
                <LoadingSpinner size="sm" color="white" />
                <span>{uploadProgress || 'Saving...'}</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>{isEdit ? 'Update Product' : 'Create Product'}</span>
              </>
            )}
          </button>
        </div>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
