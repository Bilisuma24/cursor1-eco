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
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  
  // Swipe gesture handlers for image navigation
  const minSwipeDistance = 50;
  
  const onTouchStartImage = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMoveImage = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEndImage = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && product?.images?.length > 0) {
      setSelectedImage((prev) => (prev + 1) % product.images.length);
    }
    if (isRightSwipe && product?.images?.length > 0) {
      setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

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

          // Fetch seller/store profile information if seller_id exists
          let sellerInfo = {
            name: 'Store',
            verified: false,
            rating: 4.5,
            followers: 0,
            id: null
          };

          if (dbProduct.seller_id) {
            try {
              // Fetch seller profile from database
              const { data: sellerProfile, error: profileError } = await supabase
                .from('profile')
                .select('*')
                .eq('user_id', dbProduct.seller_id)
                .single();

              if (!profileError && sellerProfile) {
                // Get store name - prioritize full_name, then username, then fallback
                const storeName = sellerProfile.full_name || 
                                  sellerProfile.username || 
                                  'Store';
                
                sellerInfo = {
                  name: storeName,
                  verified: true, // Seller with profile is verified
                  rating: 4.5, // Default rating, can be calculated from reviews later
                  followers: 0, // Can be added later if needed
                  id: dbProduct.seller_id,
                  avatar: sellerProfile.avatar_url || null
                };
              } else {
                // Fallback: Seller exists but no profile yet - use seller_id as identifier
                sellerInfo = {
                  name: `Seller ${dbProduct.seller_id.substring(0, 8)}`,
                  verified: false,
                  rating: 4.5,
                  followers: 0,
                  id: dbProduct.seller_id
                };
              }
            } catch (err) {
              console.warn('Error fetching seller profile:', err);
              // Fallback if profile fetch fails
              sellerInfo = {
                name: 'Store',
                verified: dbProduct.seller_id ? true : false,
                rating: 4.5,
                followers: 0,
                id: dbProduct.seller_id
              };
            }
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
            seller: sellerInfo,
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
    // Check stock availability
    if (product.stock !== undefined && product.stock !== null && product.stock === 0) {
      alert('This product is out of stock!');
      return;
    }
    
    if (product.stock !== undefined && product.stock !== null && quantity > product.stock) {
      alert(`Only ${product.stock} items available in stock!`);
      setQuantity(product.stock);
      return;
    }
    
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden pb-20 sm:pb-0">
      {/* Breadcrumb - MOBILE-FIRST: Enhanced */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 mobile-container">
          <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400 overflow-x-auto scrollbar-hide">
            <button 
              onClick={() => navigate(-1)} 
              className="flex items-center space-x-1 hover:text-blue-600 dark:hover:text-blue-400 shrink-0 touch-manipulation min-h-[44px] px-2"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium">Back</span>
            </button>
            <span>/</span>
            <span className="truncate">{product.category}</span>
            <span>/</span>
            <span className="text-gray-900 dark:text-white truncate max-w-[150px] sm:max-w-none">{product.name}</span>
          </div>
        </div>
      </div>

      {/* MOBILE-FIRST: Compact vertical layout with swipe support */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-8 mobile-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 items-start">
          {/* Product Media Viewer - MOBILE-FIRST: Swipe-enabled image gallery */}
          <div 
            className="space-y-3 sm:space-y-3 lg:space-y-4 w-full max-w-full"
            onTouchStart={onTouchStartImage}
            onTouchMove={onTouchMoveImage}
            onTouchEnd={onTouchEndImage}
          >
            {/* MOBILE-FIRST: Swipe-enabled image gallery */}
            <div className="w-full max-w-full overflow-hidden flex justify-center">
              <div className="w-full max-w-full sm:max-w-full md:max-w-full relative">
                <AliExpressImageZoom
                  images={product.images}
                  initialIndex={selectedImage}
                  onChange={setSelectedImage}
                />
                {/* Swipe indicators for mobile */}
                {product.images && product.images.length > 1 && (
                  <div className="flex sm:hidden justify-center gap-1.5 mt-2">
                    {product.images.map((_, i) => (
                      <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          i === selectedImage ? 'w-6 bg-blue-600' : 'w-1.5 bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Product Info - MOBILE: AliExpress-style compact vertical layout */}
          <div className="space-y-3 sm:space-y-3 md:space-y-4 lg:space-y-6">
            {/* Product Title - MOBILE: More prominent */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h1 className="text-lg sm:text-xl lg:text-3xl font-bold text-gray-900 mb-2 leading-tight break-words">{product.name}</h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                <div className="flex items-center space-x-1">
                  {renderStars(product.rating)}
                  <span className="text-gray-600">({product.reviewCount})</span>
                </div>
                <span className="text-gray-500">{product.sold}+ sold</span>
              </div>
            </div>

            {/* Price - MOBILE: More prominent */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 border border-red-100">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-red-600">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-base sm:text-lg lg:text-xl text-gray-500 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
                {product.discount && (
                  <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    -{product.discount}% OFF
                  </span>
                )}
              </div>
            </div>

            {/* MOBILE-FIRST: Quantity Selector and Action Buttons */}
            <div className="space-y-3 sm:space-y-4">
              {/* Quantity Selector */}
              <div className="flex items-center gap-3 sm:gap-4">
                <span className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">Quantity:</span>
                <div className="flex items-center border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="min-w-[44px] min-h-[44px] px-3 flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors touch-manipulation"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="min-w-[44px] min-h-[44px] px-4 flex items-center justify-center font-semibold text-gray-900 dark:text-white border-x border-gray-300 dark:border-gray-600">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock || 999, quantity + 1))}
                    disabled={product.stock !== undefined && product.stock !== null && quantity >= product.stock}
                    className="min-w-[44px] min-h-[44px] px-3 flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Action Buttons - Desktop */}
              <div className="hidden sm:flex gap-3 md:gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock !== undefined && product.stock !== null && product.stock === 0}
                  className="flex-1 min-h-[48px] bg-gradient-to-r from-red-600 to-red-700 text-white py-3.5 px-4 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-bold flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-red-600 disabled:hover:to-red-700 text-base touch-manipulation shadow-lg shadow-red-200 active:scale-95"
                >
                  <ShoppingCart className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate">{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                </button>
                <button
                  onClick={handleWishlistToggle}
                  className={`min-w-[48px] min-h-[48px] px-4 py-3.5 rounded-xl border-2 transition-all duration-200 flex items-center justify-center touch-manipulation active:scale-95 ${
                    isInWishlist(product.id)
                      ? 'border-red-500 bg-red-50 text-red-600'
                      : 'border-gray-300 bg-white hover:border-red-500 hover:text-red-600'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                </button>
                <button className="min-w-[48px] min-h-[48px] px-4 py-3.5 border-2 border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 touch-manipulation active:scale-95">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Shipping Info - MOBILE: Compact cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {product.shipping?.free && (
                <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-lg p-3">
                  <Truck className="w-5 h-5 flex-shrink-0 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Free Shipping</span>
                </div>
              )}
              <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <Check className="w-5 h-5 flex-shrink-0 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">30-Day Returns</span>
              </div>
            </div>

            {/* Seller/Store Info - Mobile compact */}
            {product.seller && (
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Seller Avatar */}
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 ring-2 ring-blue-100">
                      {product.seller.avatar ? (
                        <img 
                          src={product.seller.avatar} 
                          alt={product.seller.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-bold text-base">
                          {product.seller.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    {/* Seller Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-base text-gray-900 truncate">
                          {product.seller.name}
                        </span>
                        {product.seller.verified && (
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            <Shield className="w-4 h-4 text-blue-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="font-medium">{product.seller.rating || 4.5}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* View Store Button */}
                  {product.seller.id && (
                    <button 
                      onClick={() => navigate(`/seller/${product.seller.id}`)}
                      className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors duration-200 touch-manipulation whitespace-nowrap active:scale-95"
                    >
                      Store
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Enhanced Product Choices - Compact mobile cards */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm overflow-hidden">
              <h3 className="text-base font-bold text-gray-900 mb-4">Choose Your Options</h3>
              <div className="space-y-4">
                {/* Color Selection */}
                {product.colors && product.colors.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">
                      Color {product.colors.length === 1 && <span className="text-gray-500 font-normal">({product.colors[0]})</span>}
                    </h4>
                    {product.colors.length > 1 ? (
                      <div className="flex flex-wrap gap-2">
                        {product.colors.map((color) => (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`min-h-[44px] px-4 py-2.5 border-2 rounded-xl text-sm font-semibold transition-all duration-200 touch-manipulation active:scale-95 break-words ${
                              selectedColor === color
                                ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                                : 'border-gray-300 bg-white hover:border-gray-400'
                            }`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold inline-block">
                        {product.colors[0]}
                      </div>
                    )}
                  </div>
                )}

                {/* Size Selection */}
                {product.sizes && product.sizes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">
                      Size {product.sizes.length === 1 && <span className="text-gray-500 font-normal">({product.sizes[0]})</span>}
                    </h4>
                    {product.sizes.length > 1 ? (
                      <div className="flex flex-wrap gap-2">
                        {product.sizes.map((size) => (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`min-h-[44px] px-4 py-2.5 border-2 rounded-xl text-sm font-semibold transition-all duration-200 touch-manipulation active:scale-95 break-words ${
                              selectedSize === size
                                ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                                : 'border-gray-300 bg-white hover:border-gray-400'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold inline-block">
                        {product.sizes[0]}
                      </div>
                    )}
                  </div>
                )}

                {/* Material Selection */}
                {product.materials && product.materials.length > 1 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Material</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.materials.map((material) => (
                        <button
                          key={material}
                          onClick={() => setSelectedMaterial(material)}
                          className={`px-4 py-2.5 border-2 rounded-xl text-sm font-semibold transition-all duration-200 touch-manipulation active:scale-95 ${
                            selectedMaterial === material
                              ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-200'
                              : 'border-gray-300 bg-white hover:border-gray-400'
                          }`}
                        >
                          {material}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Selected Choices Summary */}
            {(selectedColor || selectedSize || selectedMaterial) && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-4">
                <h4 className="text-sm font-bold text-blue-900 mb-3">Your Selections</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedColor && (
                    <span className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm font-bold">
                      {selectedColor}
                    </span>
                  )}
                  {selectedSize && (
                    <span className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm font-bold">
                      {selectedSize}
                    </span>
                  )}
                  {selectedMaterial && (
                    <span className="bg-blue-100 text-blue-800 px-3 py-2 rounded-full text-sm font-bold">
                      {selectedMaterial}
                    </span>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Product Details Tabs - Mobile optimized */}
        <div className="mt-6 sm:mt-8 lg:mt-12 px-3 sm:px-0">
          <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
            <nav className="flex overflow-x-auto scrollbar-hide">
              {['description', 'choices', 'specifications', 'reviews'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-4 px-4 border-b-2 font-bold text-xs sm:text-sm capitalize whitespace-nowrap touch-manipulation transition-all ${
                    activeTab === tab
                      ? 'border-red-600 text-red-600 bg-red-50'
                      : 'border-transparent text-gray-500'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* RESPONSIVE: Aggressively reduced padding on mobile */}
          <div className="py-2 sm:py-4 lg:py-8">
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">{product.description}</p>
                {product.features && (
                  <div className="mt-4 sm:mt-6">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Key Features</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                      {product.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-green-50 rounded-lg border border-green-200">
                          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 shrink-0" />
                          <span className="text-xs sm:text-sm text-gray-700 font-medium">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'choices' && (
              <div className="space-y-4 sm:space-y-6 lg:space-y-8">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Available Choices</h3>
                  
                  {/* Colors */}
                  {product.colors && product.colors.length > 1 && (
                    <div className="mb-4 sm:mb-6 lg:mb-8">
                      <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Colors ({product.colors.length} options)</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                        {product.colors.map((color) => (
                          <div key={color} className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200">
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
                    <div className="mb-4 sm:mb-6 lg:mb-8">
                      <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Sizes ({product.sizes.length} options)</h4>
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
                    <div className="mb-4 sm:mb-6 lg:mb-8">
                      <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Materials ({product.materials.length} options)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3">
                        {product.materials.map((material) => (
                          <div key={material} className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all duration-200">
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
                    <div className="mb-4 sm:mb-6 lg:mb-8">
                      <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Styles ({product.styles.length} options)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                        {product.styles.map((style) => (
                          <div key={style} className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all duration-200">
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
                    <div className="mb-4 sm:mb-6 lg:mb-8">
                      <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Features ({product.features.length} included)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                        {product.features.map((feature, index) => (
                          <div key={index} className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
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

        {/* Suggested Products - RESPONSIVE: Horizontal scrollable on mobile */}
        {suggestedProducts.length > 0 && (
          <div className="mt-6 sm:mt-8 md:mt-12 lg:mt-16 overflow-x-hidden">
            <h2 className="text-xl sm:text-xl md:text-2xl font-bold text-gray-900 mb-4 sm:mb-4 md:mb-6 lg:mb-8 px-3 sm:px-0">You might also like</h2>
            {/* RESPONSIVE: Horizontal scroll on mobile, grid on desktop */}
            <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4 lg:gap-6 overflow-x-auto sm:overflow-x-visible pb-4 sm:pb-0 px-3 sm:px-0 scrollbar-hide">
              {suggestedProducts.map((suggestedProduct) => (
                <div
                  key={suggestedProduct.id}
                  onClick={() => navigate(`/product/${suggestedProduct.id}`)}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden cursor-pointer flex-shrink-0 w-44 sm:w-auto touch-manipulation active:scale-95"
                >
                  <div className="aspect-square overflow-hidden w-full">
                    <img
                      src={suggestedProduct.images[0]}
                      alt={suggestedProduct.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
                      {suggestedProduct.name}
                    </h3>
                    <div className="flex items-center space-x-1 mb-2">
                      {renderStars(suggestedProduct.rating)}
                      <span className="text-xs text-gray-500">({suggestedProduct.reviewCount})</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-bold text-red-600">
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

        </div>
    </div>
  );
}