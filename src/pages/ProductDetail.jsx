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

  const handleBuyNow = () => {
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
    
    // Add to cart and navigate to checkout
    addToCart(product, quantity, selectedColor, selectedSize);
    navigate('/checkout');
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
    <div className="bg-gray-50 dark:bg-gray-900 overflow-x-hidden pb-20 sm:pb-0">
      {/* Breadcrumb - MOBILE-FIRST: Enhanced */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-1.5 sm:py-2">
          <div className="flex items-center space-x-1 sm:space-x-2 text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 overflow-x-auto scrollbar-hide">
            <button 
              onClick={() => navigate(-1)} 
              className="flex items-center space-x-1 hover:text-blue-600 dark:hover:text-blue-400 shrink-0 touch-manipulation min-h-[36px] px-1.5 sm:px-2"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="font-medium">Back</span>
            </button>
            <span>/</span>
            <span className="truncate">{product.category}</span>
            <span>/</span>
            <span className="text-gray-900 dark:text-white truncate max-w-[150px] sm:max-w-none">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Product Media Viewer - Full width image */}
      <div 
        className="w-full relative"
        onTouchStart={onTouchStartImage}
        onTouchMove={onTouchMoveImage}
        onTouchEnd={onTouchEndImage}
      >
        <div className="w-full overflow-hidden relative">
          <AliExpressImageZoom
            images={product.images}
            initialIndex={selectedImage}
            onChange={setSelectedImage}
          />
          {/* Swipe indicators for mobile */}
          {product.images && product.images.length > 1 && (
            <div className="flex sm:hidden justify-center gap-1.5 mt-2 pb-2">
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

      {/* Product Info Section */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-5 lg:py-6">
        <div className="space-y-4 sm:space-y-5">
          {/* Product Title and Rating */}
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-3 leading-tight break-words">
              {product.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm sm:text-base">
              <div className="flex items-center space-x-1.5">
                {renderStars(product.rating)}
                <span className="text-gray-600 dark:text-gray-400 font-medium">({product.reviewCount})</span>
              </div>
              <span className="text-gray-500 dark:text-gray-400">{product.sold}+ sold</span>
            </div>
          </div>

          {/* Price */}
          <div className="flex flex-wrap items-baseline gap-3 sm:gap-4">
            <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-red-600 dark:text-red-400">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-base sm:text-lg lg:text-xl text-gray-500 dark:text-gray-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
            {product.discount && (
              <span className="bg-red-600 dark:bg-red-500 text-white px-3 py-1.5 rounded-full text-sm sm:text-base font-bold shadow-sm">
                -{product.discount}% OFF
              </span>
            )}
          </div>

          {/* Product Description */}
          {product.description && (
            <div>
              <p className="text-base sm:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          {/* Shipping Info */}
          {product.shipping?.free && (
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center">
                <Truck className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm sm:text-base font-semibold text-green-800 dark:text-green-300">Free Shipping</span>
            </div>
          )}

          {/* Product Options */}
          {(product.colors && product.colors.length > 0) || (product.sizes && product.sizes.length > 0) || (product.materials && product.materials.length > 1) ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-4">Choose Your Options</h3>
              <div className="space-y-4">
                {/* Color Selection */}
                {product.colors && product.colors.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
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
                                ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-200 dark:border-blue-500 dark:bg-blue-900/20 dark:text-blue-300'
                                : 'border-gray-300 bg-white hover:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500'
                            }`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold inline-block">
                        {product.colors[0]}
                      </div>
                    )}
                  </div>
                )}

                {/* Size Selection */}
                {product.sizes && product.sizes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
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
                                ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-200 dark:border-blue-500 dark:bg-blue-900/20 dark:text-blue-300'
                                : 'border-gray-300 bg-white hover:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-semibold inline-block">
                        {product.sizes[0]}
                      </div>
                    )}
                  </div>
                )}

                {/* Material Selection */}
                {product.materials && product.materials.length > 1 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Material</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.materials.map((material) => (
                        <button
                          key={material}
                          onClick={() => setSelectedMaterial(material)}
                          className={`px-4 py-2.5 border-2 rounded-xl text-sm font-semibold transition-all duration-200 touch-manipulation active:scale-95 ${
                            selectedMaterial === material
                              ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-200 dark:border-blue-500 dark:bg-blue-900/20 dark:text-blue-300'
                              : 'border-gray-300 bg-white hover:border-gray-400 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500'
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
          ) : null}

          {/* Quantity Selector */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Quantity:</span>
            <div className="flex items-center border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="min-w-[48px] min-h-[48px] px-4 flex items-center justify-center bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 active:bg-gray-200 dark:active:bg-gray-500 transition-all duration-200 touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-50 dark:disabled:hover:bg-gray-700 group"
                aria-label="Decrease quantity"
              >
                <Minus className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
              </button>
              <input
                type="number"
                min="1"
                max={product.stock || 999}
                value={quantity}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  const maxStock = product.stock || 999;
                  setQuantity(Math.max(1, Math.min(value, maxStock)));
                }}
                className="w-16 min-h-[48px] px-3 text-center font-semibold text-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 border-x border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                aria-label="Quantity"
              />
              <button
                onClick={() => setQuantity(Math.min(product.stock || 999, quantity + 1))}
                disabled={product.stock !== undefined && product.stock !== null && quantity >= product.stock}
                className="min-w-[48px] min-h-[48px] px-4 flex items-center justify-center bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 active:bg-gray-200 dark:active:bg-gray-500 transition-all duration-200 touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-50 dark:disabled:hover:bg-gray-700 group"
                aria-label="Increase quantity"
              >
                <Plus className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
              </button>
            </div>
            {product.stock !== undefined && product.stock !== null && (
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {product.stock} available
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleBuyNow}
              disabled={product.stock !== undefined && product.stock !== null && product.stock === 0}
              className="flex-1 min-h-[52px] sm:min-h-[48px] bg-gradient-to-r from-orange-600 to-orange-700 text-white py-3.5 sm:py-2.5 px-4 rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all duration-200 font-bold flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-orange-600 disabled:hover:to-orange-700 text-base touch-manipulation shadow-md shadow-orange-200 active:scale-95"
            >
              <span>Buy Now</span>
            </button>
            <button
              onClick={handleAddToCart}
              disabled={product.stock !== undefined && product.stock !== null && product.stock === 0}
              className="flex-1 min-h-[52px] sm:min-h-[48px] bg-gradient-to-r from-red-600 to-red-700 text-white py-3.5 sm:py-2.5 px-4 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 font-bold flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-red-600 disabled:hover:to-red-700 text-base touch-manipulation shadow-md shadow-red-200 active:scale-95"
            >
              <ShoppingCart className="w-5 h-5 flex-shrink-0" />
              <span>{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
            </button>
            <button
              onClick={handleWishlistToggle}
              className={`min-h-[52px] sm:min-h-[48px] min-w-[52px] sm:min-w-[48px] px-4 sm:px-3 rounded-lg border-2 transition-all duration-200 flex items-center justify-center touch-manipulation active:scale-95 ${
                isInWishlist(product.id)
                  ? 'border-red-500 bg-red-50 text-red-600 dark:border-red-500 dark:bg-red-900/20 dark:text-red-400'
                  : 'border-gray-300 bg-white hover:border-red-500 hover:text-red-600 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-red-500 dark:hover:text-red-400'
              }`}
            >
              <Heart className={`w-5 h-5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: product.name,
                    text: product.description,
                    url: window.location.href,
                  });
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Link copied to clipboard!');
                }
              }}
              className="min-h-[52px] sm:min-h-[48px] min-w-[52px] sm:min-w-[48px] px-4 sm:px-3 rounded-lg border-2 border-gray-300 bg-white hover:border-gray-400 transition-all duration-200 flex items-center justify-center touch-manipulation active:scale-95 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500"
              aria-label="Share product"
            >
              <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Product Details Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm mt-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex space-x-1">
                {['description', 'specifications', 'reviews'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 text-sm font-medium transition-colors ${
                      activeTab === tab
                        ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 sm:p-6">
              {activeTab === 'description' && (
                <div className="prose max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {product.description || 'No description available.'}
                  </p>
                </div>
              )}
              {activeTab === 'specifications' && (
                <div className="space-y-3">
                  {product.brand && (
                    <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Brand</span>
                      <span className="text-gray-600 dark:text-gray-400">{product.brand}</span>
                    </div>
                  )}
                  {product.category && (
                    <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Category</span>
                      <span className="text-gray-600 dark:text-gray-400">{product.category}</span>
                    </div>
                  )}
                  {product.stock !== undefined && product.stock !== null && (
                    <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="font-medium text-gray-700 dark:text-gray-300">Stock</span>
                      <span className="text-gray-600 dark:text-gray-400">{product.stock} available</span>
                    </div>
                  )}
                  {product.features && product.features.length > 0 && (
                    <div className="py-2">
                      <span className="font-medium text-gray-700 dark:text-gray-300 block mb-2">Features</span>
                      <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                        {product.features.map((feature, index) => (
                          <li key={index}>{feature}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'reviews' && (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">No reviews yet. Be the first to review this product!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Suggested Products - RESPONSIVE: Horizontal scrollable on mobile */}
        {suggestedProducts.length > 0 && (
          <div className="mt-4 sm:mt-6 lg:mt-8 overflow-x-hidden">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">You might also like</h2>
            {/* RESPONSIVE: Horizontal scroll on mobile, grid on desktop */}
            <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 overflow-x-auto sm:overflow-x-visible pb-4 sm:pb-0 scrollbar-hide">
              {suggestedProducts.map((suggestedProduct) => (
                <div
                  key={suggestedProduct.id}
                  onClick={() => navigate(`/product/${suggestedProduct.id}`)}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 overflow-hidden cursor-pointer flex-shrink-0 w-44 sm:w-auto touch-manipulation active:scale-95"
                >
                  <div className="aspect-square overflow-hidden w-full border border-gray-100 bg-white rounded">
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