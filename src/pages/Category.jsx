import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import ProductCard from "../components/ProductCard";
import ProductGrid from "../components/ProductGrid";
import productsData from "../data/products.js";
import { supabase } from "../lib/supabaseClient";

export default function Category() {
  const { categoryName } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const decodedCategoryName = categoryName ? decodeURIComponent(categoryName) : '';

  useEffect(() => {
    fetchCategoryProducts();
  }, [categoryName]);

  const fetchCategoryProducts = async () => {
    setLoading(true);
    try {
      let dbProducts = null;
      
      try {
        // Fetch products from database filtered by category
        const { data, error: dbError } = await supabase
          .from('product')
          .select('*')
          .ilike('category', decodedCategoryName)
          .order('created_at', { ascending: false });

        if (dbError) {
          console.error('Error fetching products from database:', dbError);
          dbProducts = null;
        } else {
          dbProducts = data;
        }
      } catch (networkError) {
        console.warn('Network error fetching products:', networkError);
        dbProducts = null;
      }

      // Helper function to convert image paths to public URLs
      const convertToPublicUrl = (imagePath) => {
        if (!imagePath || typeof imagePath !== 'string') {
          return null;
        }
        
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
          return imagePath;
        }

        // If it's a storage path, construct the public URL
        if (imagePath.includes('product-images')) {
          const { data } = supabase.storage.from('product-images').getPublicUrl(imagePath);
          return data.publicUrl;
        }

        return imagePath;
      };

      // Transform database products
      const transformedDbProducts = (dbProducts || []).map((product) => {
        const images = Array.isArray(product.images) ? product.images : [];
        const convertedImages = images
          .map(img => convertToPublicUrl(img))
          .filter(img => img !== null);

        return {
          id: product.id,
          name: product.name,
          description: product.description || '',
          price: product.price || 0,
          currency: product.currency || 'ETB',
          images: convertedImages.length > 0 ? convertedImages : [`data:image/svg+xml;base64,${btoa(`<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="#f3f4f6"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="18" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>`)}`],
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

      // Filter static products by category
      const staticProducts = (productsData.products || []).filter(
        product => product.category && product.category.toLowerCase() === decodedCategoryName.toLowerCase()
      );

      // Combine and deduplicate
      const combinedProducts = [...transformedDbProducts, ...staticProducts];
      const uniqueProducts = combinedProducts.reduce((acc, product) => {
        if (!acc.find(p => p.id === product.id)) {
          acc.push(product);
        }
        return acc;
      }, []);

      setProducts(uniqueProducts);
    } catch (error) {
      console.error('Error fetching category products:', error);
      // Fallback to static products filtered by category
      const staticProducts = (productsData.products || []).filter(
        product => product.category && product.category.toLowerCase() === decodedCategoryName.toLowerCase()
      );
      setProducts(staticProducts);
    } finally {
      setLoading(false);
    }
  };

  // Find category icon
  const category = productsData.categories?.find(
    cat => cat.name.toLowerCase() === decodedCategoryName.toLowerCase()
  );

  // Category-specific banner configurations
  const getCategoryBanner = () => {
    const categoryLower = decodedCategoryName.toLowerCase();
    const banners = {
      'electronics': {
        bgColor: 'bg-gradient-to-r from-blue-600 to-purple-600',
        title: 'Tech Innovation',
        subtitle: 'Latest gadgets and smart devices',
        cta: 'Shop Electronics',
        icon: '📱'
      },
      'fashion': {
        bgColor: 'bg-gradient-to-r from-pink-500 to-rose-500',
        title: 'Style & Trends',
        subtitle: 'Discover your perfect look',
        cta: 'Shop Fashion',
        icon: '👕'
      },
      'home & garden': {
        bgColor: 'bg-gradient-to-r from-amber-500 to-orange-500',
        title: 'Home Essentials',
        subtitle: 'Transform your living space',
        cta: 'Shop Home & Garden',
        icon: '🏠'
      },
      'sports & outdoors': {
        bgColor: 'bg-gradient-to-r from-green-500 to-emerald-600',
        title: 'Active Lifestyle',
        subtitle: 'Gear up for your next adventure',
        cta: 'Shop Sports & Outdoors',
        icon: '⚽'
      },
      'health & beauty': {
        bgColor: 'bg-gradient-to-r from-purple-500 to-pink-500',
        title: 'Beauty & Care',
        subtitle: 'Look and feel your best',
        cta: 'Shop Health & Beauty',
        icon: '💄'
      },
      'automotive': {
        bgColor: 'bg-gradient-to-r from-gray-700 to-gray-900',
        title: 'Auto Parts',
        subtitle: 'Everything for your vehicle',
        cta: 'Shop Automotive',
        icon: '🚗'
      },
      'toys & games': {
        bgColor: 'bg-gradient-to-r from-yellow-400 to-orange-400',
        title: 'Fun & Games',
        subtitle: 'Bring joy to every moment',
        cta: 'Shop Toys & Games',
        icon: '🎮'
      },
      'books & media': {
        bgColor: 'bg-gradient-to-r from-indigo-500 to-blue-600',
        title: 'Knowledge Hub',
        subtitle: 'Expand your mind',
        cta: 'Shop Books & Media',
        icon: '📚'
      },
      'pet supplies': {
        bgColor: 'bg-gradient-to-r from-teal-500 to-cyan-500',
        title: 'Pet Care',
        subtitle: 'Love your furry friends',
        cta: 'Shop Pet Supplies',
        icon: '🐾'
      },
      'baby & kids': {
        bgColor: 'bg-gradient-to-r from-rose-400 to-pink-400',
        title: 'Little Ones',
        subtitle: 'Everything for your child',
        cta: 'Shop Baby & Kids',
        icon: '👶'
      },
      'food & beverages': {
        bgColor: 'bg-gradient-to-r from-red-500 to-orange-500',
        title: 'Tasty Treats',
        subtitle: 'Delicious flavors await',
        cta: 'Shop Food & Beverages',
        icon: '🍔'
      },
      'office supplies': {
        bgColor: 'bg-gradient-to-r from-blue-500 to-indigo-600',
        title: 'Work & Study',
        subtitle: 'Stay organized and productive',
        cta: 'Shop Office Supplies',
        icon: '📎'
      },
      'jewelry & watches': {
        bgColor: 'bg-gradient-to-r from-amber-400 to-yellow-400',
        title: 'Elegant Accessories',
        subtitle: 'Sparkle and shine',
        cta: 'Shop Jewelry & Watches',
        icon: '💍'
      },
      'musical instruments': {
        bgColor: 'bg-gradient-to-r from-violet-500 to-purple-600',
        title: 'Music & Sound',
        subtitle: 'Create beautiful melodies',
        cta: 'Shop Musical Instruments',
        icon: '🎸'
      },
      'art & crafts': {
        bgColor: 'bg-gradient-to-r from-cyan-500 to-teal-500',
        title: 'Creative Expression',
        subtitle: 'Unleash your creativity',
        cta: 'Shop Art & Crafts',
        icon: '🎨'
      },
      'luggage & travel': {
        bgColor: 'bg-gradient-to-r from-sky-500 to-blue-500',
        title: 'Adventure Awaits',
        subtitle: 'Pack for your next journey',
        cta: 'Shop Luggage & Travel',
        icon: '🧳'
      },
      'industrial & scientific': {
        bgColor: 'bg-gradient-to-r from-slate-600 to-gray-700',
        title: 'Professional Tools',
        subtitle: 'Precision and quality',
        cta: 'Shop Industrial & Scientific',
        icon: '🔬'
      },
      'home improvement': {
        bgColor: 'bg-gradient-to-r from-orange-600 to-red-600',
        title: 'Renovate & Upgrade',
        subtitle: 'Transform your space',
        cta: 'Shop Home Improvement',
        icon: '🔧'
      }
    };

    return banners[categoryLower] || {
      bgColor: 'bg-gradient-to-r from-gray-600 to-gray-800',
      title: decodedCategoryName,
      subtitle: `Explore ${decodedCategoryName} products`,
      cta: `Shop ${decodedCategoryName}`,
      icon: category?.icon || '📦'
    };
  };

  const banner = getCategoryBanner();

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Category Banner */}
        <section className="pt-0 pb-2 bg-white">
          <div className={`relative overflow-hidden ${banner.bgColor} text-white min-h-[90px] shadow-xl`}>
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.35),transparent_55%)]" />
            <div className="relative py-2 px-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-lg">{banner.icon}</span>
                <span className="text-[6px] font-semibold uppercase tracking-wide text-white/80">
                  {decodedCategoryName}
                </span>
              </div>
              <h2 className="text-sm font-bold mb-0.5">{banner.title}</h2>
              <p className="text-[9px] text-white/90 mb-1.5">{banner.subtitle}</p>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="inline-flex items-center gap-0.5 bg-white text-gray-900 font-semibold px-2 py-0.5 rounded-full shadow hover:bg-white/90 transition-colors text-[8px]"
              >
                Explore
                <ChevronRight className="w-2 h-2" />
              </button>
            </div>
          </div>
        </section>

        {/* Header */}
        <div className="sticky top-[56px] z-40 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-1 -ml-1">
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </Link>
            <div className="flex items-center gap-2 flex-1">
              {category?.icon && <span className="text-xl">{category.icon}</span>}
              <h1 className="text-lg font-bold text-gray-900">{decodedCategoryName}</h1>
            </div>
            <span className="text-sm text-gray-500">{products.length} items</span>
          </div>
        </div>

        {/* Products Grid */}
        <div className="p-2">
          {loading ? (
            <div className="grid grid-cols-2 gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-gray-200 animate-pulse rounded aspect-square" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <ProductGrid products={products} />
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500 mb-4">No products found in {decodedCategoryName}</p>
              <Link to="/shop" className="text-[#3b82f6] font-medium">
                Browse all products
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:block">
        {/* Category Banner - Desktop */}
        <section className="bg-white pb-4">
          <div className={`relative overflow-hidden ${banner.bgColor} text-white min-h-[130px] shadow-xl`}>
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.45),transparent_60%)]" />
            <div className="relative max-w-7xl mx-auto px-8 py-4">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-2xl">{banner.icon}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-white/80">
                  {decodedCategoryName}
                </span>
              </div>
              <h2 className="text-2xl font-bold mb-0.5">{banner.title}</h2>
              <p className="text-sm text-white/90 mb-2">{banner.subtitle}</p>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="inline-flex items-center gap-1.5 bg-white text-gray-900 font-semibold px-4 py-1.5 rounded-full shadow-lg hover:bg-white/90 transition-colors text-xs"
              >
                Explore Collection
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* Header */}
        <div className="max-w-7xl mx-auto px-8 py-6">
          <Link to="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-3">
            {category?.icon && <span className="text-3xl">{category.icon}</span>}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{decodedCategoryName}</h1>
              <p className="text-gray-500 mt-1">{products.length} products available</p>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="max-w-7xl mx-auto px-8 pb-6">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="bg-gray-200 animate-pulse rounded aspect-square" />
              ))}
            </div>
          ) : products.length > 0 ? (
            <ProductGrid products={products} />
          ) : (
            <div className="p-12 text-center">
              <p className="text-gray-500 text-lg mb-4">No products found in {decodedCategoryName}</p>
              <Link to="/shop" className="text-[#3b82f6] font-medium hover:underline">
                Browse all products
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

