import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Heart, 
  ShoppingCart, 
  Star, 
  Truck, 
  Shield, 
  Check, 
  Minus, 
  Plus,
  ArrowLeft,
  Share2,
  MessageCircle
} from "lucide-react";
import { useCart } from "../contexts/CartContext";
import productsData from "../data/products.js";
import ImageGallery from "../components/ImageGallery";
import ColorImageFilter from "../components/ColorImageFilter";
import ImagePreviewGrid from "../components/ImagePreviewGrid";
import ProductImageDetailModal from "../components/ProductImageDetailModal";
import ProductMediaViewer from "../components/ProductMediaViewer";
import AliExpressImageZoom from "../components/AliExpressImageZoom";
import PriceAlertButton from "../components/PriceAlertButton";
import { supabase } from "../lib/supabaseClient";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const autoplayRef = useRef(null);
  const [isAutoplaying, setIsAutoplaying] = useState(true);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      
      // First, try to find in static products
      const foundProduct = productsData.products.find(p => p.id === parseInt(id));
      if (foundProduct) {
        setProduct(foundProduct);
        setSelectedColor(foundProduct.colors?.[0] || null);
        setSelectedSize(foundProduct.sizes?.[0] || null);
        setSelectedMaterial(foundProduct.materials?.[0] || null);
        setSelectedStyle(foundProduct.styles?.[0] || null);
        
        // Get suggested products (same category, different products)
        const suggested = productsData.products
          .filter(p => p.category === foundProduct.category && p.id !== foundProduct.id)
          .slice(0, 4);
        setSuggestedProducts(suggested);
        setLoading(false);
        return;
      }

      // If not found in static data, fetch from database
      try {
        console.log('Fetching product from database:', id);
        const { data: dbProduct, error } = await supabase
          .from('product')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error fetching product from database:', error);
          setLoading(false);
          return;
        }

        if (dbProduct) {
          console.log('Found product in database:', dbProduct);
          
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

          // Transform database product to match ProductCard format
          let imageArray = [];
          
          // Check product.images array first
          if (dbProduct.images) {
            if (Array.isArray(dbProduct.images) && dbProduct.images.length > 0) {
              imageArray = dbProduct.images.filter(img => img != null && img !== '');
            } else if (typeof dbProduct.images === 'string' && dbProduct.images.trim()) {
              // Handle case where images might be stored as a single string instead of array
              try {
                const parsed = JSON.parse(dbProduct.images);
                if (Array.isArray(parsed)) {
                  imageArray = parsed.filter(img => img != null && img !== '');
                } else {
                  imageArray = [dbProduct.images];
                }
              } catch {
                imageArray = [dbProduct.images];
              }
            }
          }
          
          // Check product.image_url (could be array or string) if images is empty
          if (imageArray.length === 0 && dbProduct.image_url) {
            if (Array.isArray(dbProduct.image_url)) {
              imageArray = dbProduct.image_url.filter(img => img != null && img !== '');
            } else if (typeof dbProduct.image_url === 'string' && dbProduct.image_url.trim()) {
              imageArray = [dbProduct.image_url];
            }
          }
          
          // Convert all image paths to public URLs
          const convertedImages = imageArray
            .map(img => {
              if (typeof img === 'string' && img.trim()) {
                const trimmed = img.trim();
                // Skip ALL via.placeholder.com URLs (they don't work and cause errors)
                if (trimmed.includes('via.placeholder.com')) {
                  return null;
                }
                // If it's already a full URL, return it
                if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image')) {
                  return trimmed;
                }
                // Try to convert relative path to public URL
                const publicUrl = convertToPublicUrl(trimmed);
                // Only return if we got a valid URL back
                if (publicUrl && (publicUrl.startsWith('http://') || publicUrl.startsWith('https://'))) {
                  return publicUrl;
                }
                // If conversion failed, skip it
                return null;
              }
              return null;
            })
            .filter(img => {
              // Only keep valid URLs that start with http/https or data URIs
              if (typeof img === 'string' && img.trim().length > 0) {
                const trimmed = img.trim();
                return trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image');
              }
              return false;
            });
          
          // Use converted images or placeholder
          let finalImages = convertedImages;
          if (finalImages.length === 0) {
            console.warn(`⚠️ Product ${dbProduct.id} has no images, using SVG placeholder`);
            const svgPlaceholder = `data:image/svg+xml;base64,${btoa(`<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
              <rect width="400" height="400" fill="#f3f4f6"/>
              <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="18" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">No Image</text>
            </svg>`)}`;
            finalImages = [svgPlaceholder];
          } else {
            console.log(`✅ Product ${dbProduct.id} has ${finalImages.length} images:`, finalImages);
          }

          // Transform to expected format
          const transformedProduct = {
            id: dbProduct.id,
            name: dbProduct.name || 'Untitled Product',
            description: dbProduct.description || '',
            price: parseFloat(dbProduct.price) || 0,
            images: finalImages,
            category: dbProduct.category || 'General',
            rating: dbProduct.rating || 4.0,
            reviewCount: dbProduct.review_count || 0,
            sold: dbProduct.sold || 0,
            stock: dbProduct.stock || 0,
            brand: dbProduct.brand || '',
            subcategory: dbProduct.subcategory || '',
            seller: {
              name: 'Seller',
              verified: dbProduct.seller_id ? true : false,
            },
            shipping: {
              free: dbProduct.free_shipping || false,
              express: dbProduct.express_shipping || false,
            },
            features: dbProduct.features || [],
            originalPrice: dbProduct.original_price || null,
            discount: dbProduct.discount || null,
            colors: dbProduct.colors && Array.isArray(dbProduct.colors) && dbProduct.colors.length > 0 ? dbProduct.colors : null,
            sizes: dbProduct.sizes && Array.isArray(dbProduct.sizes) && dbProduct.sizes.length > 0 ? dbProduct.sizes : null,
            gender: dbProduct.gender || null,
            materials: dbProduct.materials || [],
            styles: dbProduct.styles || [],
            currency: 'USD',
            isFromDatabase: true,
          };

          setProduct(transformedProduct);
          // Set initial selections from product options
          if (transformedProduct.colors && transformedProduct.colors.length > 0) {
            setSelectedColor(transformedProduct.colors[0]);
          }
          if (transformedProduct.sizes && transformedProduct.sizes.length > 0) {
            setSelectedSize(transformedProduct.sizes[0]);
          }
          setSelectedMaterial(transformedProduct.materials?.[0] || null);
          setSelectedStyle(transformedProduct.styles?.[0] || null);

          // Get suggested products from database (same category)
          try {
            const { data: suggested } = await supabase
              .from('product')
              .select('*')
              .eq('category', transformedProduct.category)
              .neq('id', transformedProduct.id)
              .limit(4);
            
            if (suggested && suggested.length > 0) {
              const transformedSuggested = suggested.map(p => ({
                id: p.id,
                name: p.name,
                price: parseFloat(p.price) || 0,
                rating: p.rating || 4.0,
                reviewCount: p.review_count || 0,
                images: (() => {
                  let imgArray = [];
                  if (p.images && Array.isArray(p.images) && p.images.length > 0) {
                    imgArray = p.images;
                  } else if (p.image_url) {
                    imgArray = Array.isArray(p.image_url) ? p.image_url : [p.image_url];
                  }
                  const converted = imgArray
                    .map(img => {
                      if (typeof img === 'string' && img.trim()) {
                        const trimmed = img.trim();
                        if (trimmed.includes('via.placeholder.com')) return null;
                        if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:image')) {
                          return trimmed;
                        }
                        const publicUrl = convertToPublicUrl(trimmed);
                        return publicUrl && (publicUrl.startsWith('http://') || publicUrl.startsWith('https://')) ? publicUrl : null;
                      }
                      return null;
                    })
                    .filter(Boolean);
                  return converted.length > 0 ? converted : [`data:image/svg+xml;base64,${btoa(`<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="#f3f4f6"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="18" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>`)}`];
                })(),
                category: p.category,
              }));
              setSuggestedProducts(transformedSuggested);
            }
          } catch (err) {
            console.warn('Error fetching suggested products:', err);
          }
        }
      } catch (err) {
        console.error('Error loading product:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  // Autoplay carousel
  useEffect(() => {
    if (!product || !isAutoplaying) return;
    autoplayRef.current = setInterval(() => {
      setSelectedImage((prev) => {
        const next = (prev + 1) % (product?.images?.length || 1);
        return next;
      });
    }, 4000);
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [product, isAutoplaying]);

  if (loading || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedColor, selectedSize);
    // Show success message
    alert(`${product.name} added to cart!`);
  };

  const handleWishlistToggle = () => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: product.currency || 'USD'
    }).format(price);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const renderReviewStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <button onClick={() => navigate(-1)} className="flex items-center space-x-1 hover:text-blue-600">
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <span>/</span>
            <span>{product.category}</span>
            <span>/</span>
            <span className="text-gray-900">{product.name}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Product Media Viewer: zoom, gallery, 360° */}
          <div className="space-y-4">
            {/* AliExpress-style side preview zoom */}
            <AliExpressImageZoom
              images={product.images}
              initialIndex={selectedImage}
              zoomRatio={3}
              previewWidth={360}
              onChange={setSelectedImage}
            />

            {/* Keep the original gallery/360 below if you want both */}
            <ProductMediaViewer
              images={product.images}
              spinImages={product.spinImages || product.images360 || []}
              initialIndex={selectedImage}
              onChange={setSelectedImage}
            />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Product Title */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  {renderStars(product.rating)}
                  <span className="text-sm text-gray-600">({product.reviewCount} reviews)</span>
                </div>
                <span className="text-sm text-gray-500">{product.sold}+ sold</span>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-center space-x-4">
              <span className="text-3xl font-bold text-red-600">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-lg text-gray-500 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
              {product.discount && (
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium">
                  -{product.discount}%
                </span>
              )}
            </div>

            {/* Seller Info */}
            {product.seller && (
              <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-600">Sold by</span>
                <span className="font-medium">{product.seller.name}</span>
                {product.seller.verified && (
                  <Shield className="w-4 h-4 text-blue-500" />
                )}
                <span className="text-sm text-gray-500">
                  ({product.seller.rating}★ • {product.seller.followers.toLocaleString()} followers)
                </span>
              </div>
            )}

            {/* Enhanced Product Choices */}
            <div className="space-y-6">
              {/* Gender Display */}
              {product.gender && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Gender</h3>
                  <div className="inline-block px-4 py-2 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium">
                    {product.gender}
                  </div>
                </div>
              )}

              {/* Color Selection */}
              {product.colors && product.colors.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Color {product.colors.length === 1 && <span className="text-gray-500 font-normal">({product.colors[0]})</span>}
                  </h3>
                  {product.colors.length > 1 ? (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {product.colors.map((color) => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`px-4 py-2 border-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                              selectedColor === color
                                ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                            }`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                      {selectedColor && (
                        <p className="text-xs text-gray-600 mt-2">
                          Selected: <span className="font-medium">{selectedColor}</span>
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium inline-block">
                      {product.colors[0]}
                    </div>
                  )}
                </div>
              )}

              {/* Size Selection */}
              {product.sizes && product.sizes.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Size {product.sizes.length === 1 && <span className="text-gray-500 font-normal">({product.sizes[0]})</span>}
                  </h3>
                  {product.sizes.length > 1 ? (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {product.sizes.map((size) => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`px-4 py-2 border-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                              selectedSize === size
                                ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                      {selectedSize && (
                        <p className="text-xs text-gray-600 mt-2">
                          Selected: <span className="font-medium">{selectedSize}</span>
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium inline-block">
                      {product.sizes[0]}
                    </div>
                  )}
                </div>
              )}

              {/* Material Selection */}
              {product.materials && product.materials.length > 1 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Material</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.materials.map((material) => (
                      <button
                        key={material}
                        onClick={() => setSelectedMaterial(material)}
                        className={`px-4 py-2 border-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          selectedMaterial === material
                            ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        {material}
                      </button>
                    ))}
                  </div>
                  {selectedMaterial && (
                    <p className="text-xs text-gray-600 mt-2">
                      Selected: <span className="font-medium">{selectedMaterial}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Style Selection */}
              {product.styles && product.styles.length > 1 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Style</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.styles.map((style) => (
                      <button
                        key={style}
                        onClick={() => setSelectedStyle(style)}
                        className={`px-4 py-2 border-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          selectedStyle === style
                            ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                  {selectedStyle && (
                    <p className="text-xs text-gray-600 mt-2">
                      Selected: <span className="font-medium">{selectedStyle}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Selected Choices Summary */}
              {(selectedColor || selectedSize || selectedMaterial || selectedStyle) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Your Selections:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedColor && (
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                        Color: {selectedColor}
                      </span>
                    )}
                    {selectedSize && (
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                        Size: {selectedSize}
                      </span>
                    )}
                    {selectedMaterial && (
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                        Material: {selectedMaterial}
                      </span>
                    )}
                    {selectedStyle && (
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                        Style: {selectedStyle}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Stock Availability */}
            {product.stock !== undefined && product.stock !== null && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-blue-900 mb-1">Available Stock</h3>
                    <p className="text-lg font-bold text-blue-700">
                      {product.stock > 0 ? (
                        <span className="text-green-600">{product.stock} items available</span>
                      ) : (
                        <span className="text-red-600">Out of Stock</span>
                      )}
                    </p>
                  </div>
                  {product.stock > 0 && product.stock < 10 && (
                    <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-lg text-xs font-medium">
                      Limited Stock!
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Quantity</h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  max={product.stock || 999}
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    const maxStock = product.stock || 999;
                    setQuantity(Math.max(1, Math.min(val, maxStock)));
                  }}
                  className="w-20 text-center border border-gray-300 rounded-md py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => {
                    const maxStock = product.stock || 999;
                    setQuantity(Math.min(maxStock, quantity + 1));
                  }}
                  disabled={quantity >= (product.stock || 999)}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {product.stock !== undefined && product.stock !== null && (
                <p className="text-xs text-gray-500 mt-2">
                  Maximum quantity: {product.stock} {product.stock === 1 ? 'item' : 'items'}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <div className="flex space-x-4">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium flex items-center justify-center space-x-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Add to Cart</span>
                </button>
                <button
                  onClick={handleWishlistToggle}
                  className={`px-6 py-3 rounded-lg border-2 transition-colors duration-200 flex items-center justify-center space-x-2 ${
                    isInWishlist(product.id)
                      ? 'border-red-500 bg-red-50 text-red-600'
                      : 'border-gray-300 hover:border-red-500 hover:text-red-600'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                  <span>Wishlist</span>
                </button>
                <button className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
              {/* Price Alert Button */}
              {product && (
                <PriceAlertButton product={product} currentPrice={product.price} />
              )}
            </div>

            {/* Shipping Info */}
            <div className="space-y-2">
              {product.shipping?.free && (
                <div className="flex items-center space-x-2 text-green-600">
                  <Truck className="w-4 h-4" />
                  <span className="text-sm">Free shipping on orders over $50</span>
                </div>
              )}
              <div className="flex items-center space-x-2 text-gray-600">
                <Check className="w-4 h-4" />
                <span className="text-sm">30-day return policy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-12">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {['description', 'choices', 'specifications', 'reviews'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="py-8">
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
                {product.features && (
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Key Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {product.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <Check className="w-5 h-5 text-green-600 shrink-0" />
                          <span className="text-gray-700 font-medium">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'choices' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Available Choices</h3>
                  
                  {/* Colors */}
                  {product.colors && product.colors.length > 1 && (
                    <div className="mb-8">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Colors ({product.colors.length} options)</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {product.colors.map((color) => (
                          <div key={color} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200">
                            <div className="text-center">
                              <div className="w-8 h-8 bg-gray-200 rounded-full mx-auto mb-2"></div>
                              <span className="text-sm font-medium text-gray-900">{color}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sizes */}
                  {product.sizes && product.sizes.length > 1 && (
                    <div className="mb-8">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Sizes ({product.sizes.length} options)</h4>
                      <div className="flex flex-wrap gap-2">
                        {product.sizes.map((size) => (
                          <span key={size} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium">
                            {size}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Materials */}
                  {product.materials && product.materials.length > 1 && (
                    <div className="mb-8">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Materials ({product.materials.length} options)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {product.materials.map((material) => (
                          <div key={material} className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all duration-200">
                            <div className="flex items-center space-x-3">
                              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-green-600" />
                              </div>
                              <span className="text-sm font-medium text-gray-900">{material}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Styles */}
                  {product.styles && product.styles.length > 1 && (
                    <div className="mb-8">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Styles ({product.styles.length} options)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {product.styles.map((style) => (
                          <div key={style} className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all duration-200">
                            <div className="flex items-center space-x-3">
                              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-purple-600">S</span>
                              </div>
                              <span className="text-sm font-medium text-gray-900">{style}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Features */}
                  {product.features && product.features.length > 0 && (
                    <div className="mb-8">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Features ({product.features.length} included)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {product.features.map((feature, index) => (
                          <div key={index} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Check className="w-5 h-5 text-blue-600 shrink-0" />
                              <span className="text-sm font-medium text-gray-900">{feature}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'specifications' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(product.specifications || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-gray-200">
                    <span className="font-medium text-gray-900">{key}</span>
                    <span className="text-gray-700">{value}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    {renderStars(product.rating)}
                  </div>
                  <span className="text-2xl font-bold">{product.rating}</span>
                  <span className="text-gray-600">({product.reviewCount} reviews)</span>
                </div>

                <div className="space-y-4">
                  {product.reviews?.map((review) => (
                    <div key={review.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{review.user}</span>
                          {review.verified && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              Verified Purchase
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1">
                          {renderReviewStars(review.rating)}
                        </div>
                      </div>
                      <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
                      <p className="text-gray-700 mb-3">{review.comment}</p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{new Date(review.date).toLocaleDateString()}</span>
                        <span>{review.helpful} people found this helpful</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      </div>

        {/* Suggested Products */}
        {suggestedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">You might also like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {suggestedProducts.map((suggestedProduct) => (
                <div
                  key={suggestedProduct.id}
                  onClick={() => navigate(`/product/${suggestedProduct.id}`)}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 overflow-hidden cursor-pointer"
                >
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={suggestedProduct.images[0]}
                      alt={suggestedProduct.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-800 mb-2 line-clamp-2">
                      {suggestedProduct.name}
                    </h3>
                    <div className="flex items-center space-x-1 mb-2">
                      {renderStars(suggestedProduct.rating)}
                      <span className="text-xs text-gray-500">({suggestedProduct.reviewCount})</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-red-600">
                        {formatPrice(suggestedProduct.price)}
                      </span>
                      {suggestedProduct.originalPrice && (
                        <span className="text-sm text-gray-500 line-through">
                          {formatPrice(suggestedProduct.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Product Detail Modal */}
        <ProductImageDetailModal
          product={product}
          isOpen={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          selectedImage={selectedImage}
          onImageSelect={setSelectedImage}
        />
        </div>
    </div>
  );
}