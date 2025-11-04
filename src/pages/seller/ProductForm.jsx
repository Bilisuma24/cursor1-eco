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
    category: '',
    free_shipping: false,
    express_shipping: false,
    shipping_cost: '',
    colors: [],
    sizes: [],
    gender: ''
  });
  const [colorInput, setColorInput] = useState('');
  const [sizeInput, setSizeInput] = useState('');
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
        category: product.category || '',
        free_shipping: product.free_shipping || false,
        express_shipping: product.express_shipping || false,
        shipping_cost: product.shipping_cost || '',
        colors: product.colors || [],
        sizes: product.sizes || [],
        gender: product.gender || ''
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
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Category-specific requirements
  const getCategoryRequirements = (category) => {
    const requirements = {
      'Fashion': { colors: true, sizes: true, gender: true },
      'Clothing': { colors: true, sizes: true, gender: true },
      'Shoes': { colors: true, sizes: true, gender: true },
      'Jewelry & Watches': { colors: true, sizes: false, gender: true },
      'Sports & Outdoors': { colors: true, sizes: true, gender: true },
      'Health & Beauty': { colors: false, sizes: false, gender: true },
      'Beauty': { colors: false, sizes: false, gender: true },
      'Electronics': { colors: false, sizes: false, gender: false },
      'Home & Garden': { colors: false, sizes: false, gender: false },
      'Home': { colors: false, sizes: false, gender: false },
      'Home Improvement': { colors: false, sizes: false, gender: false },
      'Garden': { colors: false, sizes: false, gender: false },
      'Automotive': { colors: true, sizes: false, gender: false },
      'Toys & Games': { colors: false, sizes: false, gender: false },
      'Baby & Kids': { colors: true, sizes: true, gender: true },
      'Books & Media': { colors: false, sizes: false, gender: false },
      'Pet Supplies': { colors: false, sizes: false, gender: false },
      'Food & Beverages': { colors: false, sizes: false, gender: false },
      'Office Supplies': { colors: false, sizes: false, gender: false },
      'Musical Instruments': { colors: true, sizes: false, gender: false },
      'Art & Crafts': { colors: true, sizes: false, gender: false },
      'Luggage & Travel': { colors: true, sizes: false, gender: false },
      'Industrial & Scientific': { colors: false, sizes: false, gender: false }
    };
    
    // Try to match category (case-insensitive, partial match)
    for (const [key, value] of Object.entries(requirements)) {
      if (category.toLowerCase().includes(key.toLowerCase())) {
        return value;
      }
    }
    
    // Default: all optional
    return { colors: false, sizes: false, gender: false };
  };

  const requirements = getCategoryRequirements(formData.category);

  const handleAddColor = () => {
    if (colorInput.trim() && !formData.colors.includes(colorInput.trim())) {
      setFormData(prev => ({
        ...prev,
        colors: [...prev.colors, colorInput.trim()]
      }));
      setColorInput('');
    }
  };

  const handleRemoveColor = (colorToRemove) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter(color => color !== colorToRemove)
    }));
  };

  const handleAddSize = () => {
    if (sizeInput.trim() && !formData.sizes.includes(sizeInput.trim())) {
      setFormData(prev => ({
        ...prev,
        sizes: [...prev.sizes, sizeInput.trim()]
      }));
      setSizeInput('');
    }
  };

  const handleRemoveSize = (sizeToRemove) => {
    setFormData(prev => ({
      ...prev,
      sizes: prev.sizes.filter(size => size !== sizeToRemove)
    }));
  };

  const commonColors = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Purple', 'Orange', 'Brown', 'Gray', 'Navy', 'Beige', 'Cream'];
  const commonSizes = {
    'Clothing': ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
    'Shoes': ['6', '7', '8', '9', '10', '11', '12', '13'],
    'General': ['Small', 'Medium', 'Large', 'Extra Large', 'One Size']
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

    // Category-specific validation
    const requirements = getCategoryRequirements(formData.category);
    if (requirements.colors && formData.colors.length === 0) {
      setError('At least one color is required for this category');
      return false;
    }
    if (requirements.sizes && formData.sizes.length === 0) {
      setError('At least one size is required for this category');
      return false;
    }
    if (requirements.gender && !formData.gender) {
      setError('Gender selection is required for this category');
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
      
      setUploadProgress('Uploading images...');
      setProgress(20);

      // Upload images if there are new files to upload
      let allImageUrls = [];
      if (images && images.length > 0) {
        try {
          // Separate existing images (already uploaded) from new files
          const existingImages = images.filter(img => img.isExisting && img.preview).map(img => img.preview);
          const newFiles = images.filter(img => !img.isExisting && img.file);
          
          console.log('Existing images:', existingImages);
          console.log('New files to upload:', newFiles);
          
          // Upload new files if any
          if (newFiles.length > 0) {
            setUploadProgress(`Uploading ${newFiles.length} image(s)...`);
            // Use product ID for edit mode, user ID for new products
            const folderKey = isEdit ? id : user.id;
            const uploadedUrls = await productService.uploadProductImages(newFiles, folderKey);
            console.log('Uploaded image URLs:', uploadedUrls);
            allImageUrls = [...existingImages, ...uploadedUrls];
          } else {
            allImageUrls = existingImages;
          }
        } catch (uploadError) {
          console.error('Error uploading images:', uploadError);
          // Continue without images rather than failing completely
          setError('Warning: Product created but image upload failed. ' + uploadError.message);
        }
      }

      setUploadProgress(isEdit ? 'Updating product...' : 'Creating product...');
      setProgress(50);

      // Create the product data with images
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        category: formData.category || 'General',
        seller_id: user.id,
        free_shipping: formData.free_shipping || false,
        express_shipping: formData.express_shipping || false,
        shipping_cost: formData.free_shipping ? 0 : (formData.shipping_cost ? parseFloat(formData.shipping_cost) : null),
        colors: formData.colors.length > 0 ? formData.colors : null,
        sizes: formData.sizes.length > 0 ? formData.sizes : null,
        gender: formData.gender || null,
        // Use empty array instead of null for PostgreSQL TEXT[] compatibility
        images: allImageUrls.length > 0 ? allImageUrls : []
      };

      console.log(isEdit ? 'Updating product with data:' : 'Creating product with data:', productData);
      setProgress(60);

      // Try to create or update product
      let result;
      if (isEdit) {
        // Update existing product
        result = await productService.updateProduct(id, productData);
        console.log('Product updated successfully:', result);
        setUploadProgress('Product updated successfully!');
      } else {
        // Create new product
        result = await productService.createProduct(productData);
        console.log('Product created successfully:', result);
        setUploadProgress('Product created successfully!');
      }
      setProgress(90);

      setProgress(100);
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/seller-dashboard/products');
      }, 2000);
    } catch (err) {
      console.error('========== FORM SUBMISSION ERROR ==========');
      console.error(`Error ${isEdit ? 'updating' : 'creating'} product:`, err);
      setError(`Failed to ${isEdit ? 'update' : 'create'} product: ${err.message}`);
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
              <div>
                <FloatingLabelInput
                  id="stock"
                  label="Available Stock (How many you have)"
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleInputChange}
                  min="0"
                  placeholder="0"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the total number of items you have available for sale
                </p>
              </div>
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

            {/* Product Options - Colors, Sizes, Gender */}
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Product Options</h3>

              {/* Colors */}
              {(requirements.colors || formData.colors.length > 0) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Colors {requirements.colors && <span className="text-red-500">*</span>}
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={colorInput}
                      onChange={(e) => setColorInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddColor())}
                      placeholder="Enter color name"
                      className="flex-1 form-input border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={handleAddColor}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Add
                    </button>
                  </div>
                  {/* Quick color selection */}
                  <div className="flex flex-wrap gap-2 mb-2">
                    {commonColors.slice(0, 8).map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => {
                          if (!formData.colors.includes(color)) {
                            setFormData(prev => ({ ...prev, colors: [...prev.colors, color] }));
                          }
                        }}
                        className="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                      >
                        + {color}
                      </button>
                    ))}
                  </div>
                  {/* Selected colors */}
                  {formData.colors.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.colors.map((color, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded text-xs"
                        >
                          {color}
                          <button
                            type="button"
                            onClick={() => handleRemoveColor(color)}
                            className="hover:text-red-600"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Sizes */}
              {(requirements.sizes || formData.sizes.length > 0) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sizes {requirements.sizes && <span className="text-red-500">*</span>}
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={sizeInput}
                      onChange={(e) => setSizeInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSize())}
                      placeholder="Enter size (e.g., S, M, L, XL)"
                      className="flex-1 form-input border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={handleAddSize}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      Add
                    </button>
                  </div>
                  {/* Quick size selection */}
                  {(() => {
                    const category = formData.category?.toLowerCase() || '';
                    const sizeList = category.includes('shoe') || category.includes('footwear') 
                      ? commonSizes.Shoes 
                      : category.includes('clothing') || category.includes('fashion') || category.includes('apparel')
                      ? commonSizes.Clothing
                      : commonSizes.General;
                    
                    return (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {sizeList.map(size => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => {
                              if (!formData.sizes.includes(size)) {
                                setFormData(prev => ({ ...prev, sizes: [...prev.sizes, size] }));
                              }
                            }}
                            className="px-2 py-1 text-xs bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          >
                            + {size}
                          </button>
                        ))}
                      </div>
                    );
                  })()}
                  {/* Selected sizes */}
                  {formData.sizes.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.sizes.map((size, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded text-xs"
                        >
                          {size}
                          <button
                            type="button"
                            onClick={() => handleRemoveSize(size)}
                            className="hover:text-red-600"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Gender */}
              {(requirements.gender || formData.gender) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Gender {requirements.gender && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full form-select border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Unisex">Unisex</option>
                    <option value="Kids">Kids</option>
                  </select>
                </div>
              )}

              {/* Show message if no options needed for category */}
              {!requirements.colors && !requirements.sizes && !requirements.gender && formData.category && (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  Optional: You can add colors, sizes, or gender options if applicable to your product.
                </p>
              )}
            </div>

            {/* Shipping Options */}
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Shipping & Delivery</h3>
              
              {/* Free Shipping */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="free_shipping"
                  name="free_shipping"
                  checked={formData.free_shipping}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="free_shipping" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  Free Shipping
                </label>
              </div>

              {/* Express Shipping */}
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="express_shipping"
                  name="express_shipping"
                  checked={formData.express_shipping}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="express_shipping" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  Express Shipping Available
                </label>
              </div>

              {/* Shipping Cost - Only show if not free shipping */}
              {!formData.free_shipping && (
                <div>
                  <FloatingLabelInput
                    id="shipping_cost"
                    label="Shipping Cost ($)"
                    type="number"
                    name="shipping_cost"
                    value={formData.shipping_cost}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Leave empty if shipping cost varies or will be calculated at checkout
                  </p>
                </div>
              )}

              {formData.free_shipping && (
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                  ✓ Customers will receive free shipping for this product
                </p>
              )}
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
