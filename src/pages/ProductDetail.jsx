import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  Heart, 
  ShoppingCart, 
  Star, 
  Truck, 
  Shield, 
  Check, 
  Minus, 
  Plus,
  Share2,
  MessageCircle,
  ArrowLeft,
  Package
} from "lucide-react";
import { useCart } from "../contexts/CartContext";
import productsData from "../data/products.js";
import AliExpressImageZoom from "../components/AliExpressImageZoom";
import PriceAlertButton from "../components/PriceAlertButton";
import ProductCard from "../components/ProductCard";
import Logo from "../components/Logo";
import { supabase } from "../lib/supabaseClient";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useCart();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  
  // Soft, product-based shadow color for a more attractive feel
  const getShadowColor = () => {
    if (!product) return 'rgba(0,0,0,0.08)';
    const key = String(product.color || product.category || product.name || product.id || 'p')
      .toLowerCase();
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    }
    const hue = hash % 360;
    return `hsla(${hue}, 80%, 72%, 0.22)`;
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
                currency: p.currency || 'USD',
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

  // Reset image dimensions when image index changes
  useEffect(() => {
    if (product?.images && product.images[currentImageIndex]) {
      setImageDimensions({ width: 0, height: 0 });
      // Create a new image to get dimensions
      const img = new Image();
      img.onload = () => {
        setImageDimensions({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      };
      img.src = product.images[currentImageIndex];
    }
  }, [currentImageIndex, product?.images]);

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

  const isWishlisted = isInWishlist(product.id);
  const discountPercentage = product.originalPrice && product.originalPrice > product.price
    ? Math.round(100 - (product.price / product.originalPrice) * 100)
    : product.discount;

  const hasOptions = Boolean(
    (product.colors && product.colors.length > 0) ||
    (product.sizes && product.sizes.length > 0) ||
    (product.materials && product.materials.length > 1)
  );

  const renderPriceSection = () => (
    <div className="bg-gradient-to-br from-[#fff6f2] to-white border border-[#ffd5c2] rounded-xl p-2 sm:p-2.5 shadow-sm space-y-1.5">
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="text-3xl sm:text-4xl font-bold text-[#ff4747]">
          {formatPrice(product.price)}
        </span>
        {product.originalPrice && (
          <span className="text-base sm:text-lg text-gray-400 line-through">
            {formatPrice(product.originalPrice)}
          </span>
        )}
        {discountPercentage && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-white bg-[#ff8b4a] px-3 py-1 rounded-full shadow-sm">
            -{discountPercentage}% today
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
        <span>VAT included</span>
        <span className="inline-flex items-center gap-1 text-[#ff4747] font-semibold">
          <Check className="w-4 h-4" />
          Best price in 30 days
        </span>
      </div>
    </div>
  );

  const renderOptionsSection = (extraClasses = "") => {
    if (!hasOptions) return null;
    return (
      <div className={`bg-white border border-gray-200 rounded-2xl shadow-sm p-3 sm:p-4 ${extraClasses}`}>
        <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-3">Choose your options</h3>
        <div className="space-y-3">
          {product.colors && product.colors.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-900">Color</h4>
                {product.colors.length === 1 && (
                  <span className="text-xs text-gray-500">{product.colors[0]}</span>
                )}
              </div>
              {product.colors.length > 1 ? (
                <div className="flex flex-wrap gap-2.5">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`min-h-[44px] px-4 py-2.5 border-2 rounded-xl text-sm font-semibold transition-all duration-200 touch-manipulation active:scale-95 break-words ${
                        selectedColor === color
                          ? 'border-[#ff6a3c] bg-[#fff1ea] text-[#ff6a3c] shadow-sm'
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

          {product.sizes && product.sizes.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-900">Size</h4>
                {product.sizes.length === 1 && (
                  <span className="text-xs text-gray-500">{product.sizes[0]}</span>
                )}
              </div>
              {product.sizes.length > 1 ? (
                <div className="flex flex-wrap gap-2.5">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`min-h-[44px] px-4 py-2.5 border-2 rounded-xl text-sm font-semibold transition-all duration-200 touch-manipulation active:scale-95 break-words ${
                        selectedSize === size
                          ? 'border-[#ff6a3c] bg-[#fff1ea] text-[#ff6a3c] shadow-sm'
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

          {product.materials && product.materials.length > 1 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Material</h4>
              <div className="flex flex-wrap gap-2.5">
                {product.materials.map((material) => (
                  <button
                    key={material}
                    onClick={() => setSelectedMaterial(material)}
                    className={`min-h-[44px] px-4 py-2.5 border-2 rounded-xl text-sm font-semibold transition-all duration-200 touch-manipulation active:scale-95 break-words ${
                      selectedMaterial === material
                        ? 'border-[#ff6a3c] bg-[#fff1ea] text-[#ff6a3c] shadow-sm'
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
    );
  };

  const renderQuantitySelector = (extraClasses = "") => (
    <div className={`flex items-center gap-4 ${extraClasses}`}>
      <span className="text-sm font-medium text-gray-700">Quantity</span>
      <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white hover:border-gray-300 transition-all duration-200">
        <button
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          disabled={quantity <= 1}
          className="min-w-[48px] min-h-[48px] px-4 flex items-center justify-center bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-50 group"
          aria-label="Decrease quantity"
        >
          <Minus className="w-5 h-5 text-gray-600 group-hover:text-gray-900 transition-colors" />
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
          className="w-16 min-h-[48px] px-3 text-center font-semibold text-lg text-gray-900 bg-white border-x border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#ff6a3c] focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          aria-label="Quantity"
        />
        <button
          onClick={() => setQuantity(Math.min(product.stock || 999, quantity + 1))}
          disabled={product.stock !== undefined && product.stock !== null && quantity >= product.stock}
          className="min-w-[48px] min-h-[48px] px-4 flex items-center justify-center bg-gray-50 hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 touch-manipulation disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-50 group"
          aria-label="Increase quantity"
        >
          <Plus className="w-5 h-5 text-gray-600 group-hover:text-gray-900 transition-colors" />
        </button>
      </div>
      {product.stock !== undefined && product.stock !== null && (
        <span className="text-xs text-gray-500">{product.stock} available</span>
      )}
    </div>
  );

  const renderActionButtons = (extraClasses = "") => (
    <div className={`space-y-3 ${extraClasses}`}>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={handleBuyNow}
          disabled={product.stock !== undefined && product.stock !== null && product.stock === 0}
          className="min-h-[52px] rounded-xl bg-gradient-to-r from-[#ff9248] to-[#ff6a3c] text-white font-semibold text-base py-3.5 px-4 shadow-lg shadow-orange-200/60 hover:from-[#ff7c3a] hover:to-[#ff512f] active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Buy Now
        </button>
        <button
          onClick={handleAddToCart}
          disabled={product.stock !== undefined && product.stock !== null && product.stock === 0}
          className="min-h-[52px] rounded-xl border-2 border-[#ff6a3c] text-[#ff6a3c] font-semibold text-base py-3.5 px-4 bg-white hover:bg-[#fff4ef] active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleWishlistToggle}
          className={`flex-1 min-h-[48px] rounded-xl border-2 transition-all duration-200 flex items-center justify-center gap-2 ${
            isWishlisted
              ? 'border-[#ff6a3c] bg-[#fff4ef] text-[#ff6a3c]'
              : 'border-gray-300 bg-white text-gray-700 hover:border-[#ff6a3c] hover:text-[#ff6a3c]'
          }`}
        >
          <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
          <span>{isWishlisted ? 'In Wishlist' : 'Wishlist'}</span>
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
          className="min-h-[48px] min-w-[48px] rounded-xl border-2 border-gray-300 bg-white hover:border-gray-400 transition-all duration-200 flex items-center justify-center"
          aria-label="Share product"
        >
          <Share2 className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );


  const seller = product.seller || {};
  const sellerInitial = (seller.name || 'Store').charAt(0).toUpperCase();
  const sellerRating = seller.rating || product.rating || 4.5;
  const sellerFollowers = seller.followers ?? 0;

  const renderStoreCard = (extraClasses = "") => (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-sm p-2.5 space-y-2 ${extraClasses}`}>
      <div className="flex items-center gap-2">
        {seller.avatar ? (
          <img src={seller.avatar} alt={seller.name} className="w-10 h-10 rounded-full object-cover border" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff6a3c] to-[#ff4747] text-white font-semibold flex items-center justify-center text-sm">
            {sellerInitial}
          </div>
        )}
        <div>
          <p className="text-xs sm:text-sm font-semibold text-gray-900">{seller.name || 'Official Store'}</p>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <span className="inline-flex items-center gap-0.5">
              <Star className="w-3 h-3 text-[#ffb266] fill-current" />
              {sellerRating.toFixed(1)}
            </span>
            <span>• {sellerFollowers}+ followers</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5 text-center">
        <div className="rounded-lg bg-[#fff6f2] text-[#ff6a3c] px-2 py-1.5">
          <p className="text-xs font-semibold">{(product.sold || 0) + 100}</p>
          <p className="text-[10px] uppercase tracking-wide">Orders</p>
        </div>
        <div className="rounded-lg bg-gray-100 text-gray-700 px-2 py-1.5">
          <p className="text-xs font-semibold">4.8</p>
          <p className="text-[10px] uppercase tracking-wide">Service</p>
        </div>
        <div className="rounded-lg bg-gray-100 text-gray-700 px-2 py-1.5">
          <p className="text-xs font-semibold">98%</p>
          <p className="text-[10px] uppercase tracking-wide">Positive</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            // Navigate to store profile if seller ID exists, otherwise go to shop
            if (seller.id) {
              navigate(`/store/${seller.id}`);
            } else {
              navigate('/shop');
            }
          }}
          className="flex-1 min-h-[36px] rounded-lg border-2 border-[#ff6a3c] text-[#ff6a3c] font-semibold text-xs py-1.5 hover:bg-[#fff4ef] transition-colors"
        >
          Visit Store
        </button>
        <button
          onClick={() => navigate('/contact')}
          className="flex-1 min-h-[36px] rounded-lg border-2 border-gray-200 text-gray-700 font-semibold text-xs py-1.5 hover:border-[#ff6a3c] hover:text-[#ff6a3c] transition-colors"
        >
          Chat Now
        </button>
      </div>
    </div>
  );

  const detailsTabs = (
    <div id="product-details-tabs" className="mt-2 lg:mt-3 bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="border-b border-gray-200">
        <div className="flex gap-0 px-1.5 lg:px-2">
          {['description', 'specifications', 'reviews'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2 py-1 text-[10px] sm:text-xs font-medium transition-colors ${
                activeTab === tab
                  ? 'text-[#ff6a3c] border-b-2 border-[#ff6a3c]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="p-2 sm:p-2.5 lg:p-3">
        {activeTab === 'description' && (
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-tight text-[11px] sm:text-xs">
              {product.description || 'No description available.'}
            </p>
          </div>
        )}
        {activeTab === 'specifications' && (
          <div className="space-y-0.5">
            {product.brand && (
              <div className="flex justify-between py-0.5 border-b border-gray-200">
                <span className="font-medium text-gray-700 text-[11px] sm:text-xs">Brand</span>
                <span className="text-gray-600 text-[11px] sm:text-xs">{product.brand}</span>
              </div>
            )}
            {product.category && (
              <div className="flex justify-between py-0.5 border-b border-gray-200">
                <span className="font-medium text-gray-700 text-[11px] sm:text-xs">Category</span>
                <span className="text-gray-600 text-[11px] sm:text-xs">{product.category}</span>
              </div>
            )}
            {product.stock !== undefined && product.stock !== null && (
              <div className="flex justify-between py-0.5 border-b border-gray-200">
                <span className="font-medium text-gray-700 text-[11px] sm:text-xs">Stock</span>
                <span className="text-gray-600 text-[11px] sm:text-xs">{product.stock} available</span>
              </div>
            )}
            {product.features && product.features.length > 0 && (
              <div className="py-0.5">
                <span className="font-medium text-gray-700 block mb-0.5 text-[11px] sm:text-xs">Key features</span>
                <ul className="list-disc list-inside space-y-0 text-gray-600 text-[11px] sm:text-xs leading-tight">
                  {product.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
        {activeTab === 'reviews' && (
          <div className="text-center py-2">
            <MessageCircle className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
            <p className="text-gray-600 text-[11px] sm:text-xs">No reviews yet. Be the first to share your experience!</p>
          </div>
        )}
      </div>
    </div>
  );

  const suggestedSection = suggestedProducts.length > 0 ? (
    <div className="mt-3 lg:mt-4">
      <div className="flex items-center justify-between mb-2.5">
        <h2 className="text-lg font-bold text-gray-900">You might also like</h2>
        <button
          onClick={() => navigate('/shop')}
          className="text-sm font-semibold text-[#ff6a3c] hover:text-[#ff4d2d] transition-colors"
        >
          View all
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-2.5">
        {suggestedProducts.map((suggestedProduct) => (
          <ProductCard key={suggestedProduct.id} product={suggestedProduct} />
        ))}
      </div>
    </div>
  ) : null;

  return (
    <div className="bg-[#f7f7f7] overflow-x-hidden pb-8 lg:pb-12" style={{ margin: 0, padding: 0 }}>
      {/* Desktop Header */}
      <div className="hidden lg:block bg-white border-b-0 lg:border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-0">
          <div className="flex items-center gap-4 py-1 lg:py-0">
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <Logo className="w-8 h-8 sm:w-10 sm:h-10" />
              <span className="text-lg sm:text-xl font-bold text-[#3b82f6] hidden sm:inline">Kush deals</span>
            </Link>
            <div className="flex items-center gap-2 text-[11px] sm:text-xs text-gray-600 overflow-x-auto scrollbar-hide flex-1 min-w-0">
              <span className="truncate capitalize text-gray-500">{product.category}</span>
              <span className="text-gray-400 flex-shrink-0">/</span>
              <span className="text-gray-900 font-medium truncate max-w-[180px] sm:max-w-none">{product.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Fullscreen Image - Starts from top */}
      <div className="lg:hidden" style={{ margin: 0, padding: 0, width: '100vw', marginLeft: 'calc(-50vw + 50%)' }}>
        <div 
          className="relative overflow-hidden bg-white"
          style={{
            ...(imageDimensions.width > 0 && imageDimensions.height > 0 && {
              aspectRatio: `${imageDimensions.width} / ${imageDimensions.height}`
            }),
            maxHeight: '80vh',
            minHeight: '40vh',
            ...(!(imageDimensions.width > 0 && imageDimensions.height > 0) && {
              height: '60vh'
            }),
            margin: 0,
            padding: 0,
            width: '100vw',
            display: 'block'
          }}
        >
            {product.images && product.images.length > 0 ? (
              <>
                <img
                  src={product.images[currentImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  style={{
                    display: 'block',
                    margin: 0,
                    padding: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onLoad={(e) => {
                    const img = e.target;
                    if (img.naturalWidth && img.naturalHeight) {
                      setImageDimensions({
                        width: img.naturalWidth,
                        height: img.naturalHeight
                      });
                    }
                  }}
                />
                {/* Floating Navigation Buttons */}
                <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-safe pb-4 z-10" style={{ paddingTop: 'max(env(safe-area-inset-top), 1rem)' }}>
                  <button
                    onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md"
                  >
                    <ArrowLeft className="w-5 h-5 text-gray-700" />
                  </button>
                  <button
                    onClick={handleWishlistToggle}
                    className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center shadow-md ${
                      isWishlisted ? 'bg-[#ff6a3c]' : 'bg-white/90'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isWishlisted ? 'text-white fill-white' : 'text-gray-700'}`} />
                  </button>
                </div>
                {/* Carousel Dots */}
                {product.images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
                    {product.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`h-2 rounded-full transition-all ${
                          index === currentImageIndex ? 'bg-white w-6' : 'bg-white/60 w-2'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                <Package className="w-16 h-16 text-gray-400" />
              </div>
            )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-0 lg:px-6">
        <div className="lg:hidden">
          <div className="bg-white border border-gray-200 rounded-2xl product-shadow p-2 space-y-2 mt-4"
               style={{ ['--shadow-color']: getShadowColor() }}>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">
                {product.name}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <div className="flex items-center gap-1 text-[#ff6a3c] font-semibold">
                  {renderStars(product.rating)}
                  <span>{product.rating?.toFixed(1)}</span>
                </div>
                <span className="text-gray-300">|</span>
                <span>{product.reviewCount} reviews</span>
                <span className="text-gray-300">|</span>
                <span>{product.sold}+ orders</span>
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-700">
                <Truck className="w-4 h-4 text-[#2dae6f]" />
                <span>Free shipping available</span>
              </div>
            </div>

            {renderPriceSection()}

            {renderOptionsSection()}

            {renderQuantitySelector()}

            <div className="flex flex-wrap items-center gap-3">
              <PriceAlertButton product={product} currentPrice={product.price} />
            </div>

            {renderActionButtons()}
          </div>

          <div style={{ ['--shadow-color']: getShadowColor() }} className="product-shadow rounded-2xl">
            {renderStoreCard()}
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="grid grid-cols-[520px_minmax(0,1fr)] gap-10 items-start">
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-3xl product-shadow p-5"
                   style={{ ['--shadow-color']: getShadowColor() }}>
                <AliExpressImageZoom images={product.images} aspectClass="aspect-square" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl product-shadow px-4 py-3"
                   style={{ ['--shadow-color']: getShadowColor() }}>
                <span className="text-sm text-gray-500">Hover to zoom • {product.images.length} product photos</span>
              </div>
              <div style={{ ['--shadow-color']: getShadowColor() }} className="product-shadow rounded-2xl">
                {detailsTabs}
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="bg-white border border-gray-200 rounded-3xl product-shadow p-3.5 space-y-2.5"
                   style={{ ['--shadow-color']: getShadowColor() }}>
                <div className="space-y-3">
                  {discountPercentage && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-[#ff6a3c] bg-[#fff1ea] px-3 py-1 rounded-full">
                      Hot deal
                    </span>
                  )}
                  <h1 className="text-3xl font-bold text-gray-900 leading-tight">
                    {product.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1 text-[#ff6a3c] font-semibold">
                      {renderStars(product.rating)}
                      <span>{product.rating?.toFixed(1)}</span>
                    </div>
                    <span>{product.reviewCount} reviews</span>
                    <span>{product.sold}+ orders</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-700">
                    <Truck className="w-4 h-4 text-[#2dae6f]" />
                    <span>Free shipping available</span>
                  </div>
                </div>

                {renderPriceSection()}

                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                  <span className="inline-flex items-center gap-2 bg-[#fff1ea] text-[#ff6a3c] px-3 py-1 rounded-full font-semibold">
                    <Truck className="w-4 h-4" />
                    Free shipping
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#2dae6f]" />
                    Verified quality
                  </span>
                </div>

                <div className="mt-4">
                  {renderOptionsSection('bg-transparent border-0 shadow-none p-0')}
                </div>

                {renderQuantitySelector('mt-2')}

                <div className="flex flex-wrap items-center gap-3">
                  <PriceAlertButton product={product} currentPrice={product.price} />
                </div>

                {renderActionButtons('mt-3')}
              </div>

              <div style={{ ['--shadow-color']: getShadowColor() }} className="product-shadow rounded-2xl">
                {renderStoreCard()}
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:block">
          {suggestedSection}
        </div>
        
        <div className="lg:hidden">
          <div style={{ ['--shadow-color']: getShadowColor() }} className="product-shadow rounded-2xl">
            {detailsTabs}
          </div>
          {suggestedSection}
        </div>
      </div>
    </div>
  );
}