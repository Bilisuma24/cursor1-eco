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

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, addToWishlist, removeFromWishlist, isInWishlist } = useCart();
  
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const autoplayRef = useRef(null);
  const [isAutoplaying, setIsAutoplaying] = useState(true);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [suggestedProducts, setSuggestedProducts] = useState([]);

  // Get current images based on selected color
  const getCurrentImages = () => {
    if (product?.colorImages && selectedColor && product.colorImages[selectedColor]) {
      return product.colorImages[selectedColor];
    }
    return product?.images || [];
  };

  const currentImages = getCurrentImages();

  // Convert color name to actual color value
  const getColorValue = (colorName) => {
    const colorMap = {
      'Black': '#000000',
      'White': '#FFFFFF',
      'Blue': '#3B82F6',
      'Red': '#EF4444',
      'Silver': '#C0C0C0',
      'Rose Gold': '#E8B4B8',
      'Brown': '#8B4513',
      'Tan': '#D2B48C',
      'Gray': '#6B7280',
      'Navy': '#1E3A8A',
      'Green': '#10B981',
      'Orange': '#F97316',
      'Space Gray': '#6B7280'
    };
    return colorMap[colorName] || '#6B7280';
  };

  useEffect(() => {
    const foundProduct = productsData.products.find(p => p.id === parseInt(id));
    if (foundProduct) {
      setProduct(foundProduct);
      setSelectedColor(foundProduct.colors?.[0] || null);
      setSelectedSize(foundProduct.sizes?.[0] || null);
      
      // Get suggested products (same category, different products)
      const suggested = productsData.products
        .filter(p => p.category === foundProduct.category && p.id !== foundProduct.id)
        .slice(0, 4);
      setSuggestedProducts(suggested);
    }
  }, [id]);

  // Autoplay carousel
  useEffect(() => {
    if (!product || !isAutoplaying) return;
    autoplayRef.current = setInterval(() => {
      setSelectedImage((prev) => {
        const next = (prev + 1) % (currentImages.length || 1);
        return next;
      });
    }, 4000);
    return () => {
      if (autoplayRef.current) clearInterval(autoplayRef.current);
    };
  }, [product, isAutoplaying, currentImages]);

  if (!product) {
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images with Carousel */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square bg-white rounded-lg overflow-hidden border group">
              <img
                src={currentImages[selectedImage] || currentImages[0]}
                alt={product.name}
                className="w-full h-full object-cover"
                onMouseEnter={() => setIsAutoplaying(false)}
                onMouseLeave={() => setIsAutoplaying(true)}
              />

              {/* Prev/Next Controls */}
              {currentImages.length > 1 && (
                <>
                  <button
                    aria-label="Previous image"
                    onClick={() => setSelectedImage((selectedImage - 1 + currentImages.length) % currentImages.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ‹
                  </button>
                  <button
                    aria-label="Next image"
                    onClick={() => setSelectedImage((selectedImage + 1) % currentImages.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white w-10 h-10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ›
                  </button>
                </>
              )}

              {/* Dots */}
              {currentImages.length > 1 && (
                <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-2">
                  {currentImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`w-2.5 h-2.5 rounded-full ${idx === selectedImage ? 'bg-white' : 'bg-white/50 hover:bg-white/80'}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {currentImages.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {currentImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                      selectedImage === index ? 'border-blue-500' : 'border-gray-200'
                    }`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
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

            {/* Color Selection */}
            {product.colors && product.colors.length > 1 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Color</h3>
                <div className="flex space-x-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => {
                        setSelectedColor(color);
                        setSelectedImage(0);
                      }}
                      className={`flex items-center space-x-2 px-4 py-2 border rounded-md text-sm transition-all duration-200 ${
                        selectedColor === color
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div 
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: getColorValue(color) }}
                      />
                      <span>{color}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 1 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Size</h3>
                <div className="flex space-x-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 border rounded-md text-sm ${
                        selectedSize === size
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Quantity</h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-16 text-center border border-gray-300 rounded-md py-2">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.maxOrder || 10, quantity + 1))}
                  className="p-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
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
              {['description', 'specifications', 'reviews'].map((tab) => (
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
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {product.features.map((feature, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
        </div>
    </div>
  );
}