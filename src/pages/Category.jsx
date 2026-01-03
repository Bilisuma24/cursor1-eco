import React, { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
import ProductCard from "../components/ProductCard";
import ProductGrid from "../components/ProductGrid";
import CategoryPromoBanner from "../components/CategoryPromoBanner";
import productsData from "../data/products.js";
import { supabase } from "../lib/supabaseClient";

export default function Category() {
  const { categoryName } = useParams();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const decodedCategoryName = categoryName ? decodeURIComponent(categoryName) : '';

  // Smart detection: Is this valid top-level category or a subcategory?
  const parentCategory = productsData.categories.find(c =>
    c.subcategories.some(sub => sub.toLowerCase() === decodedCategoryName.toLowerCase())
  );

  // If it's a subcategory behaving like a category, we want to show its parent's structure
  const displayCategoryName = parentCategory ? parentCategory.name : decodedCategoryName;
  const autoSelectedSubcategory = parentCategory ? decodedCategoryName : '';

  useEffect(() => {
    fetchCategoryProducts();
  }, [categoryName]);

  const fetchCategoryProducts = async () => {
    setLoading(true);
    try {
      let dbProducts = null;

      try {
        // Fetch products from database filtered by category
        let query = supabase.from('product').select('*');

        // If specific category (not "All" or "Global"), apply filter
        if (displayCategoryName.toLowerCase() !== 'all' && displayCategoryName.toLowerCase() !== 'global') {
          if (displayCategoryName.toLowerCase() === 'home & furniture') {
            // Handle alias for Home & Furniture / Home & Garden
            query = query.or(`category.ilike.Home & Furniture,category.ilike.Home & Garden`);
          } else {
            query = query.ilike('category', displayCategoryName);
          }
        }

        const { data, error: dbError } = await query.order('created_at', { ascending: false });

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
          images: convertedImages,
          category: product.category || 'General',
          rating: product.rating || 4.0,
          reviewCount: product.review_count || 0,
          sold: product.sold || 0,
          stock: product.stock || 0,
          originalPrice: product.original_price || null,
          discount: product.discount || null,
          subcategory: product.subcategory || null,
          colors: product.colors && Array.isArray(product.colors) && product.colors.length > 0 ? product.colors : null,
          sizes: product.sizes && Array.isArray(product.sizes) && product.sizes.length > 0 ? product.sizes : null,
          isFromDatabase: true,
        };
      });

      // Filter static products by category (or all if "All" is selected)
      const staticProducts = (productsData.products || []).filter(
        product => {
          if (displayCategoryName.toLowerCase() === 'all' || displayCategoryName.toLowerCase() === 'global') return true;
          return product.category && product.category.toLowerCase() === displayCategoryName.toLowerCase();
        }
      );

      // Combine and deduplicate
      const combinedProducts = [...transformedDbProducts, ...staticProducts];
      const uniqueProducts = combinedProducts.reduce((acc, product) => {
        if (!acc.find(p => p.id === product.id)) {
          acc.push(product);
        }
        return acc;
      }, []);

      // Filter out products without images
      const productsWithImages = uniqueProducts.filter(p => (p.images?.[0] || p.image));

      setProducts(productsWithImages);
    } catch (error) {
      console.error('Error fetching category products:', error);
      // Fallback to static products filtered by category
      const staticProducts = (productsData.products || []).filter(
        product => product.category && product.category.toLowerCase() === displayCategoryName.toLowerCase()
      );
      setProducts(staticProducts);
    } finally {
      setLoading(false);
    }
  };

  // Find category icon
  const category = productsData.categories?.find(
    cat => cat.name.toLowerCase() === displayCategoryName.toLowerCase()
  );

  // 1. Calculate filtered products first
  const searchParams = new URLSearchParams(location.search);
  const subcategoryParam = searchParams.get('subcategory') || autoSelectedSubcategory;
  const searchQuery = searchParams.get('search') || '';

  const filteredProducts = products.filter(p => {
    // 1. Subcategory Filter
    if (subcategoryParam && p.subcategory !== subcategoryParam) {
      return false;
    }
    // 2. Search Text Filter
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(lowerQ) ||
        (p.description && p.description.toLowerCase().includes(lowerQ)) ||
        (p.brand && p.brand.toLowerCase().includes(lowerQ));

      if (!matchesSearch) return false;
    }
    // 3. Image availability filter
    if (!(p.images?.[0] || p.image)) {
      return false;
    }
    return true;
  });

  // 2. Determine Banner based on Filtered Results
  const getCategoryBanner = () => {
    const categoryLower = displayCategoryName.toLowerCase();
    const banners = {
      'mobile & tablets': {
        bgColor: 'bg-[#2d3436]', // Dark slate
        title: 'Mobile & Tablets',
        subtitle: 'Latest smartphones, tablets and accessories',
        cta: 'Shop Now',
        icon: '📱',
        image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=600'
      },
      'fashion': {
        bgColor: 'bg-[#1e272e]', // Charcoal
        title: 'Fashion & Apparel',
        subtitle: 'Style for every occasion',
        cta: 'Shop Fashion',
        icon: '👕',
        image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&q=80&w=600'
      },
      'home & furniture': {
        bgColor: 'bg-[#2c3e50]', // Midnight blue/slate
        title: 'Home Essentials',
        subtitle: 'Transform your living space',
        cta: 'Shop Home & Furniture',
        icon: '🏠',
        image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=600'
      },
      'home & garden': {
        bgColor: 'bg-gradient-to-r from-amber-500 to-orange-500',
        title: 'Home Essentials',
        subtitle: 'Transform your living space',
        cta: 'Shop Home & Garden',
        icon: '🏠',
        image: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=600'
      },
      'sports & outdoors': {
        bgColor: 'bg-[#130f40]', // Deep navy
        title: 'Sports & Outdoors',
        subtitle: 'Gear up for your next adventure',
        cta: 'Shop Sports',
        icon: '⚽',
        image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=600'
      },
      'health & beauty': {
        bgColor: 'bg-[#30336b]', // Royal purple/slate
        title: 'Health & Beauty',
        subtitle: 'Care for yourself inside and out',
        cta: 'Shop Beauty',
        icon: '💄',
        image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=600'
      },
      'automotive': {
        bgColor: 'bg-gradient-to-r from-gray-700 to-gray-900',
        title: 'Auto Parts',
        subtitle: 'Everything for your vehicle',
        cta: 'Shop Automotive',
        icon: '🚗',
        image: 'https://images.unsplash.com/photo-1492144537053-5798941288b7?auto=format&fit=crop&q=80&w=600'
      },
      'vehicles': {
        bgColor: 'bg-[#34495e]', // Classic slate
        title: 'Vehicles',
        subtitle: 'Explore Vehicles products',
        cta: 'Shop Vehicles',
        icon: '🚗',
        image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=600'
      },
      'toys & games': {
        bgColor: 'bg-[#4b6584]', // Soft slate
        title: 'Toys & Games',
        subtitle: 'Fun and education for all ages',
        cta: 'Shop Toys',
        icon: '🎮',
        image: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaad5b?auto=format&fit=crop&q=80&w=600'
      },
      'books & media': {
        bgColor: 'bg-gradient-to-r from-indigo-500 to-blue-600',
        title: 'Knowledge Hub',
        subtitle: 'Expand your mind',
        cta: 'Shop Books & Media',
        icon: '📚',
        image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600'
      },
      'pet supplies': {
        bgColor: 'bg-gradient-to-r from-teal-500 to-cyan-500',
        title: 'Pet Care',
        subtitle: 'Love your furry friends',
        cta: 'Shop Pet Supplies',
        icon: '🐾',
        image: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=600'
      },
      'baby & kids': {
        bgColor: 'bg-gradient-to-r from-rose-400 to-pink-400',
        title: 'Little Ones',
        subtitle: 'Everything for your child',
        cta: 'Shop Baby & Kids',
        icon: '👶',
        image: 'https://images.unsplash.com/photo-1515488764276-3d760b01e2ec?auto=format&fit=crop&q=80&w=600'
      },
      'food & beverages': {
        bgColor: 'bg-gradient-to-r from-red-500 to-orange-500',
        title: 'Tasty Treats',
        subtitle: 'Delicious flavors await',
        cta: 'Shop Food & Beverages',
        icon: '🍔',
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=600'
      },
      'office supplies': {
        bgColor: 'bg-gradient-to-r from-blue-500 to-indigo-600',
        title: 'Work & Study',
        subtitle: 'Stay organized and productive',
        cta: 'Shop Office Supplies',
        icon: '📎',
        image: 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?auto=format&fit=crop&q=80&w=600'
      },
      'jewelry & watches': {
        bgColor: 'bg-gradient-to-r from-amber-400 to-yellow-400',
        title: 'Elegant Accessories',
        subtitle: 'Sparkle and shine',
        cta: 'Shop Jewelry & Watches',
        icon: '💍',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600'
      },
      'musical instruments': {
        bgColor: 'bg-gradient-to-r from-violet-500 to-purple-600',
        title: 'Music & Sound',
        subtitle: 'Create beautiful melodies',
        cta: 'Shop Musical Instruments',
        icon: '🎸',
        image: 'https://images.unsplash.com/photo-1469442232813-3f3934f33d31?auto=format&fit=crop&q=80&w=600'
      },
      'art & crafts': {
        bgColor: 'bg-gradient-to-r from-cyan-500 to-teal-500',
        title: 'Creative Expression',
        subtitle: 'Unleash your creativity',
        cta: 'Shop Art & Crafts',
        icon: '🎨',
        image: 'https://images.unsplash.com/photo-1459908316208-229612111e75?auto=format&fit=crop&q=80&w=600'
      },
      'luggage & travel': {
        bgColor: 'bg-gradient-to-r from-sky-500 to-blue-500',
        title: 'Adventure Awaits',
        subtitle: 'Pack for your next journey',
        cta: 'Shop Luggage & Travel',
        icon: '🧳',
        image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=600'
      },
      'industrial & scientific': {
        bgColor: 'bg-gradient-to-r from-slate-600 to-gray-700',
        title: 'Professional Tools',
        subtitle: 'Precision and quality',
        cta: 'Shop Industrial & Scientific',
        icon: '🔬',
        image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=600'
      },
      'home improvement': {
        bgColor: 'bg-gradient-to-r from-orange-600 to-red-600',
        title: 'Renovate & Upgrade',
        subtitle: 'Transform your space',
        cta: 'Shop Home Improvement',
        icon: '🔧',
        image: 'https://images.unsplash.com/photo-1581141849291-1125c7b692b5?auto=format&fit=crop&q=80&w=600'
      }, // Fixed missing comma here
      'all': {
        bgColor: 'bg-gradient-to-r from-blue-500 to-indigo-500',
        title: 'All Products',
        subtitle: 'Explore our entire collection',
        cta: 'Shop All',
        icon: '🛍️',
        image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=600'
      },
      'global': {
        bgColor: 'bg-gradient-to-r from-blue-500 to-indigo-500',
        title: 'All Products',
        subtitle: 'Explore our entire collection',
        cta: 'Shop All',
        icon: '🛍️'
      }
    };

    // Smart Banner Override for Global Search
    // Smart Banner Override for Global Search
    // Check matched products (filteredProducts) instead of all products
    if ((categoryLower === 'all' || categoryLower === 'global') && filteredProducts.length > 0) {
      const catCount = {};
      let maxCount = 0;
      let dominantCat = null;

      filteredProducts.forEach(p => {
        if (p.category && p.category !== 'General') {
          // Normalize: trim whitespace
          const cleanCat = p.category.trim();
          // Use the raw string for counting key to preserve casing for display later, 
          // but we will lowercase for matching keys.
          catCount[cleanCat] = (catCount[cleanCat] || 0) + 1;

          if (catCount[cleanCat] > maxCount) {
            maxCount = catCount[cleanCat];
            dominantCat = cleanCat;
          }
        }
      });

      // Threshold: 50% dominance
      if (dominantCat && (maxCount / filteredProducts.length >= 0.5)) {
        const domLower = dominantCat.toLowerCase();

        // 1. Try Exact Match
        if (banners[domLower]) {
          return {
            ...banners[domLower],
            title: dominantCat, // Use the actual category name (e.g. "Fashion")
            subtitle: `Browse our ${dominantCat} collection`
          };
        }

        // 2. Try Partial Match (e.g. "Men's Fashion" matches "fashion")
        const partialKey = Object.keys(banners).find(key => domLower.includes(key) || key.includes(domLower));
        if (partialKey) {
          return {
            ...banners[partialKey],
            title: dominantCat,
            subtitle: `Browse our ${dominantCat} collection`
          };
        }
      }
    }

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
          <div className={`relative overflow-hidden ${banner.bgColor} text-white min-h-[85px] shadow-xl`}>
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
            <span className="text-sm text-gray-500">{filteredProducts.length} items</span>
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
          ) : filteredProducts.length > 0 ? (
            <ProductGrid products={filteredProducts} />
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
      <div className="hidden md:block bg-gray-50 min-h-screen pb-12">
        {/* Category Banner - Compact */}
        <section className="bg-white shadow-sm z-10 relative">
          <div className={`${banner.bgColor} text-white`}>
            <div className="max-w-7xl mx-auto px-6 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                    <span className="text-2xl">{banner.icon}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-3xl font-bold">{decodedCategoryName}</h1>
                      <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-medium">
                        {filteredProducts.length} items
                      </span>
                    </div>
                    <p className="text-white/90 text-sm max-w-xl">{banner.subtitle}</p>
                  </div>
                </div>
                {banner.image && (
                  <div className="hidden lg:block relative group">
                    <div className="w-44 h-28 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/30 transform rotate-3 group-hover:rotate-0 transition-transform duration-500">
                      <img src={banner.image} alt={banner.title} className="w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-500" />
                    </div>
                    {/* Decorative background element */}
                    <div className="absolute -inset-2 bg-white/10 rounded-2xl blur-xl -z-10 group-hover:bg-white/20 transition-colors" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex gap-6">
            {/* Left Sidebar Filters */}
            <div className="w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 sticky top-24">


                {/* Visual Vertical Subcategories */}
                <div className="mb-6">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center justify-between">
                    Category
                    <ChevronRight className="w-4 h-4 text-gray-400 rotate-90" />
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {((displayCategoryName.toLowerCase() === 'all' || displayCategoryName.toLowerCase() === 'global')
                      ? productsData.categories[0].subcategories
                      : (productsData.categories?.find(c => c.name.toLowerCase() === displayCategoryName.toLowerCase())?.subcategories || []))
                      .map((sub, index) => {
                        const isSelected = subcategoryParam === sub;

                        // Sprite mapping for "Mobile & Tablets"
                        const mobileSpritePositions = {
                          'phones': { x: '0%', y: '5%' },
                          'tablets': { x: '25%', y: '5%' },
                          'accessories': { x: '50%', y: '5%' },
                          'smart watches': { x: '75%', y: '5%' },
                          'headphones': { x: '100%', y: '5%' }
                        };

                        // Sprite mapping for "Home & Furniture"
                        const homeSpritePositions = {
                          'furniture': { x: '0%', y: '2%' },
                          'decor': { x: '50%', y: '2%' },
                          'kitchen': { x: '100%', y: '2%' },
                          'bathroom': { x: '0%', y: '58%' },
                          'garden': { x: '50%', y: '58%' },
                          'tools': { x: '100%', y: '58%' }
                        };

                        // Dynamic Icon based on subcategory name
                        const getSubIcon = (name) => {
                          const lower = name.toLowerCase();
                          const isVehicles = displayCategoryName.toLowerCase() === 'vehicles';

                          // Specific override for "Cars" in Vehicles
                          if (lower === 'cars' && isVehicles) {
                            return (
                              <div
                                className="w-full h-full rounded-full bg-no-repeat bg-white"
                                style={{
                                  backgroundImage: 'url(/assets/car_icon_red.jpg)',
                                  backgroundPosition: 'center',
                                  backgroundSize: '110%', // Zoom slightly to fill
                                }}
                                title={name}
                              />
                            );
                          }

                          // Specific override for Car Parts & Accessories in Vehicles
                          if (isVehicles && (lower === 'vehicle parts & accessories' || lower === 'car parts' || lower === 'accessories')) {
                            return (
                              <div
                                className="w-full h-full rounded-full bg-no-repeat bg-white"
                                style={{
                                  backgroundImage: 'url(/assets/car_parts_icon.png)',
                                  backgroundPosition: 'center',
                                  backgroundSize: '100%',
                                }}
                                title={name}
                              />
                            );
                          }

                          // Specific override for "Motorcycles & Scooters" in Vehicles
                          if (lower === 'motorcycles & scooters' && isVehicles) {
                            return (
                              <div
                                className="w-full h-full rounded-full bg-no-repeat bg-white"
                                style={{
                                  backgroundImage: 'url(/assets/motorcycle_icon.png)',
                                  backgroundPosition: 'center',
                                  backgroundSize: '110%',
                                }}
                                title={name}
                              />
                            );
                          }

                          // Check for Mobile sprite mapping
                          // Important: Ensure we don't accidentally pick up 'accessories' from mobile map if we are in vehicles (handled above by order, but safer to check category if names collide)
                          if (mobileSpritePositions[lower] && !isVehicles) {
                            return (
                              <div
                                className="w-full h-full rounded-full bg-no-repeat bg-white"
                                style={{
                                  backgroundImage: 'url(/assets/mobile_electronics_sprite.png)',
                                  backgroundPosition: `${mobileSpritePositions[lower].x} ${mobileSpritePositions[lower].y}`,
                                  backgroundSize: '525% 150%', // Zoomed to crop text at bottom
                                }}
                                title={name}
                              />
                            );
                          }

                          // Check for Home & Furniture sprite mapping
                          if (homeSpritePositions[lower]) {
                            return (
                              <div
                                className="w-full h-full rounded-full bg-no-repeat bg-white"
                                style={{
                                  backgroundImage: 'url(/assets/home_furniture_sprite.png)',
                                  backgroundPosition: `${homeSpritePositions[lower].x} ${homeSpritePositions[lower].y}`,
                                  backgroundSize: '320% 260%', // Zoomed to crop text
                                }}
                                title={name}
                              />
                            );
                          }

                          // Fallbacks
                          if (lower === 'motorcycles & scooters') return '🏍️';

                          if (lower.includes('part') || lower.includes('accessor')) return '⚙️';
                          if (lower.includes('car') && !lower.includes('parts')) return '🚗';
                          if (lower.includes('motorcycle') || lower.includes('scooter') || lower.includes('bike')) return '🏍️';
                          if (lower.includes('maintenance') || lower.includes('tool')) return '🔧';
                          if (lower.includes('tire')) return '🛞';
                          if (lower.includes('elect')) return '🔌';

                          const fallbackIcons = ['🎧', '⌚', '📷', '🔒', '💻', '📱'];
                          return fallbackIcons[index % fallbackIcons.length];
                        };

                        return (
                          <Link
                            key={sub}
                            to={isSelected ? `/category/${encodeURIComponent(displayCategoryName)}` : `/category/${encodeURIComponent(displayCategoryName)}?subcategory=${encodeURIComponent(sub)}`}
                            className="flex flex-col items-center gap-1 group"
                          >
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg border transition-all ${isSelected ? 'bg-orange-50 border-orange-500 text-orange-600 shadow-sm' : 'bg-gray-50 border-gray-100 text-gray-500 group-hover:bg-white group-hover:border-orange-300 group-hover:shadow-sm'}`}>
                              {getSubIcon(sub)}
                            </div>
                            <span className={`text-[10px] leading-[1.1] text-center w-full px-0.5 font-bold mt-1 ${isSelected ? 'text-orange-600' : 'text-gray-900 group-hover:text-orange-600'}`}>
                              {sub}
                            </span>
                          </Link>
                        );
                      })}
                  </div>
                </div>

                <div className="border-t border-gray-100 my-4"></div>

                {/* Color Filter */}
                <div className="mb-6">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center justify-between">
                    Color
                    <ChevronRight className="w-4 h-4 text-gray-400 -rotate-90" />
                  </h4>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input type="radio" name="color" className="peer w-4 h-4 border-gray-300 text-black focus:ring-black" defaultChecked />
                        <div className="w-2 h-2 bg-black rounded-full absolute pointer-events-none hidden peer-checked:block" />
                      </div>
                      <span className="text-sm text-gray-600">All</span>
                    </label>

                    {[
                      { name: 'Black', color: 'bg-black' },
                      { name: 'Multi-Color', color: 'bg-gradient-to-br from-red-500 via-green-500 to-blue-500' },
                      { name: 'White', color: 'bg-white border border-gray-200' },
                      { name: 'Pink', color: 'bg-pink-300' },
                      { name: 'Blue', color: 'bg-blue-500' },
                      { name: 'Red', color: 'bg-red-500' }
                    ].map((item) => (
                      <label key={item.name} className="flex items-center gap-3 cursor-pointer group">
                        <input type="radio" name="color" className="w-4 h-4 border-gray-300 text-black focus:ring-black" />
                        <div className={`w-8 h-8 ${item.color} rounded shadow-sm`} />
                        <span className="text-sm text-gray-600 group-hover:text-gray-900">{item.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Dynamic Brand/Model Navigation */}
              {(() => {
                const brandMap = {
                  'mobile & tablets': [
                    { name: 'Apple', logo: 'https://www.logo.wine/a/logo/Apple_Inc./Apple_Inc.-Logo.wine.svg' },
                    { name: 'Samsung', logo: 'https://www.logo.wine/a/logo/Samsung/Samsung-Logo.wine.svg' },
                    { name: 'Xiaomi', logo: 'https://www.logo.wine/a/logo/Xiaomi/Xiaomi-Logo.wine.svg' },
                    { name: 'Huawei', logo: 'https://www.logo.wine/a/logo/Huawei/Huawei-Logo.wine.svg' },
                    { name: 'Microsoft', logo: 'https://www.logo.wine/a/logo/Microsoft/Microsoft-Logo.wine.svg' },
                    { name: 'Sony', logo: 'https://www.logo.wine/a/logo/Sony/Sony-Logo.wine.svg' }
                  ],
                  'mobile & tablets/phones': [
                    { name: 'Apple', logo: 'https://www.logo.wine/a/logo/Apple_Inc./Apple_Inc.-Logo.wine.svg' },
                    { name: 'Samsung', logo: 'https://www.logo.wine/a/logo/Samsung/Samsung-Logo.wine.svg' },
                    { name: 'Huawei', logo: 'https://www.logo.wine/a/logo/Huawei/Huawei-Logo.wine.svg' },
                    { name: 'Xiaomi', logo: 'https://www.logo.wine/a/logo/Xiaomi/Xiaomi-Logo.wine.svg' },
                    { name: 'Oppo', logo: 'https://www.logo.wine/a/logo/Oppo/Oppo-Logo.wine.svg' },
                    { name: 'Vivo', logo: 'https://www.logo.wine/a/logo/Vivo_(technology_company)/Vivo_(technology_company)-Logo.wine.svg' }
                  ],
                  'mobile & tablets/tablets': [
                    { name: 'Apple', logo: 'https://www.logo.wine/a/logo/Apple_Inc./Apple_Inc.-Logo.wine.svg' },
                    { name: 'Samsung', logo: 'https://www.logo.wine/a/logo/Samsung/Samsung-Logo.wine.svg' },
                    { name: 'Microsoft', logo: 'https://www.logo.wine/a/logo/Microsoft/Microsoft-Logo.wine.svg' },
                    { name: 'Amazon', logo: 'https://www.logo.wine/a/logo/Amazon_(company)/Amazon_(company)-Logo.wine.svg' },
                    { name: 'Lenovo', logo: 'https://www.logo.wine/a/logo/Lenovo/Lenovo-Logo.wine.svg' },
                    { name: 'Huawei', logo: 'https://www.logo.wine/a/logo/Huawei/Huawei-Logo.wine.svg' }
                  ],
                  'mobile & tablets/smart watches': [
                    { name: 'Apple', logo: 'https://www.logo.wine/a/logo/Apple_Inc./Apple_Inc.-Logo.wine.svg' },
                    { name: 'Samsung', logo: 'https://www.logo.wine/a/logo/Samsung/Samsung-Logo.wine.svg' },
                    { name: 'Garmin', logo: 'https://www.logo.wine/a/logo/Garmin/Garmin-Logo.wine.svg' },
                    { name: 'Fitbit', logo: 'https://www.logo.wine/a/logo/Fitbit/Fitbit-Logo.wine.svg' },
                    { name: 'Huawei', logo: 'https://www.logo.wine/a/logo/Huawei/Huawei-Logo.wine.svg' },
                    { name: 'Amazfit', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/Amazfit_logo.svg' }
                  ],
                  'mobile & tablets/headphones': [
                    { name: 'Bose', logo: 'https://www.logo.wine/a/logo/Bose_Corporation/Bose_Corporation-Logo.wine.svg' },
                    { name: 'Sony', logo: 'https://www.logo.wine/a/logo/Sony/Sony-Logo.wine.svg' },
                    { name: 'JBL', logo: 'https://www.logo.wine/a/logo/JBL/JBL-Logo.wine.svg' },
                    { name: 'Sennheiser', logo: 'https://www.logo.wine/a/logo/Sennheiser/Sennheiser-Logo.wine.svg' },
                    { name: 'Beats', logo: 'https://www.logo.wine/a/logo/Beats_Electronics/Beats_Electronics-Logo.wine.svg' },
                    { name: 'Marshall', logo: 'https://www.logo.wine/a/logo/Marshall_Amplification/Marshall_Amplification-Logo.wine.svg' }
                  ],
                  'mobile & tablets/accessories': [
                    { name: 'Anker', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Anker_Logo.svg' },
                    { name: 'Belkin', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/0a/Belkin_logo.svg' },
                    { name: 'Spigen', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/0a/Spigen_logo.png' },
                    { name: 'Baseus', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Baseus_logo.svg' },
                    { name: 'OtterBox', logo: 'https://www.logo.wine/a/logo/OtterBox/OtterBox-Logo.wine.svg' }
                  ],
                  'fashion': [
                    { name: 'Nike', logo: 'https://www.logo.wine/a/logo/Nike%2C_Inc./Nike%2C_Inc.-Logo.wine.svg' },
                    { name: 'Adidas', logo: 'https://www.logo.wine/a/logo/Adidas/Adidas-Logo.wine.svg' },
                    { name: 'Zara', logo: 'https://www.logo.wine/a/logo/Zara_(retailer)/Zara_(retailer)-Logo.wine.svg' },
                    { name: 'H&M', logo: 'https://www.logo.wine/a/logo/H%26M/H%26M-Logo.wine.svg' },
                    { name: 'Gucci', logo: 'https://www.logo.wine/a/logo/Gucci/Gucci-Logo.wine.svg' },
                    { name: 'Prada', logo: 'https://www.logo.wine/a/logo/Prada/Prada-Logo.wine.svg' }
                  ],
                  'fashion/shoes': [
                    { name: 'Nike', logo: 'https://www.logo.wine/a/logo/Nike%2C_Inc./Nike%2C_Inc.-Logo.wine.svg' },
                    { name: 'Adidas', logo: 'https://www.logo.wine/a/logo/Adidas/Adidas-Logo.wine.svg' },
                    { name: 'Puma', logo: 'https://www.logo.wine/a/logo/Puma_(brand)/Puma_(brand)-Logo.wine.svg' },
                    { name: 'Reebok', logo: 'https://www.logo.wine/a/logo/Reebok/Reebok-Logo.wine.svg' },
                    { name: 'Vans', logo: 'https://www.logo.wine/a/logo/Vans/Vans-Logo.wine.svg' },
                    { name: 'Converse', logo: 'https://www.logo.wine/a/logo/Converse_(shoe_company)/Converse_(shoe_company)-Logo.wine.svg' }
                  ],
                  'home & furniture': [
                    { name: 'IKEA', logo: 'https://www.logo.wine/a/logo/IKEA/IKEA-Logo.wine.svg' },
                    { name: 'Wayfair', logo: 'https://www.logo.wine/a/logo/Wayfair/Wayfair-Logo.wine.svg' },
                    { name: 'Pottery Barn', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Pottery_Barn_logo.svg' },
                    { name: 'West Elm', logo: 'https://upload.wikimedia.org/wikipedia/commons/e/e0/West_Elm_logo.svg' },
                    { name: 'Ashley', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Ashley_HomeStore_logo.svg' },
                    { name: 'Herman Miller', logo: 'https://www.logo.wine/a/logo/Herman_Miller/Herman_Miller-Logo.wine.svg' }
                  ],
                  'sports & outdoors': [
                    { name: 'North Face', logo: 'https://www.logo.wine/a/logo/The_North_Face/The_North_Face-Logo.wine.svg' },
                    { name: 'Columbia', logo: 'https://www.logo.wine/a/logo/Columbia_Sportswear/Columbia_Sportswear-Logo.wine.svg' },
                    { name: 'Patagonia', logo: 'https://www.logo.wine/a/logo/Patagonia%2C_Inc./Patagonia%2C_Inc.-Logo.wine.svg' },
                    { name: 'Under Armour', logo: 'https://www.logo.wine/a/logo/Under_Armour/Under_Armour-Logo.wine.svg' },
                    { name: 'Wilson', logo: 'https://www.logo.wine/a/logo/Wilson_Sporting_Goods/Wilson_Sporting_Goods-Logo.wine.svg' },
                    { name: 'Puma', logo: 'https://www.logo.wine/a/logo/Puma_(brand)/Puma_(brand)-Logo.wine.svg' }
                  ],
                  'health & beauty': [
                    { name: "L'Oreal", logo: "https://www.logo.wine/a/logo/L%27Or%C3%A9al/L%27Or%C3%A9al-Logo.wine.svg" },
                    { name: 'Estee Lauder', logo: 'https://www.logo.wine/a/logo/The_Est%C3%A9e_Lauder_Companies/The_Est%C3%A9e_Lauder_Companies-Logo.wine.svg' },
                    { name: 'Neutrogena', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/13/Neutrogena_logo.svg' },
                    { name: 'Dove', logo: 'https://www.logo.wine/a/logo/Dove_(brand)/Dove_(brand)-Logo.wine.svg' },
                    { name: 'Sephora', logo: 'https://www.logo.wine/a/logo/Sephora/Sephora-Logo.wine.svg' },
                    { name: 'MAC', logo: 'https://www.logo.wine/a/logo/MAC_Cosmetics/MAC_Cosmetics-Logo.wine.svg' }
                  ],
                  'vehicles': [
                    { name: 'Audi', logo: 'https://www.logo.wine/a/logo/Audi/Audi-Logo.wine.svg' },
                    { name: 'BMW', logo: 'https://www.logo.wine/a/logo/BMW/BMW-Logo.wine.svg' },
                    { name: 'Ford', logo: 'https://www.logo.wine/a/logo/Ford_Motor_Company/Ford_Motor_Company-Logo.wine.svg' },
                    { name: 'Mercedes Benz', logo: 'https://www.logo.wine/a/logo/Mercedes-Benz/Mercedes-Benz-Logo.wine.svg' },
                    { name: 'Volkswagen', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Volkswagen_logo_2019.svg/300px-Volkswagen_logo_2019.svg.png' },
                    { name: 'Toyota', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Toyota_EU.svg/300px-Toyota_EU.svg.png' }
                  ],
                  'vehicles/cars': [
                    { name: 'Audi', logo: 'https://www.logo.wine/a/logo/Audi/Audi-Logo.wine.svg' },
                    { name: 'BMW', logo: 'https://www.logo.wine/a/logo/BMW/BMW-Logo.wine.svg' },
                    { name: 'Mercedes Benz', logo: 'https://www.logo.wine/a/logo/Mercedes-Benz/Mercedes-Benz-Logo.wine.svg' },
                    { name: 'Volkswagen', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Volkswagen_logo_2019.svg/300px-Volkswagen_logo_2019.svg.png' },
                    { name: 'Toyota', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Toyota_EU.svg/300px-Toyota_EU.svg.png' },
                    { name: 'Ford', logo: 'https://www.logo.wine/a/logo/Ford_Motor_Company/Ford_Motor_Company-Logo.wine.svg' }
                  ],
                  // Explicit mapping for "Car Parts" and "Accessories" to show the specific parts categories
                  'vehicles/vehicle parts & accessories': [
                    { name: 'Engine & Drivetrain', spritePos: '0%' },
                    { name: 'Exterior Accessories', spritePos: '20%' },
                    { name: 'Oils & Fluids', spritePos: '40%' },
                    { name: 'Safety & Security', spritePos: '60%' },
                    { name: 'Wheels & Parts', spritePos: '80%' },
                    { name: 'Headlights & Lighting', spritePos: '100%' }
                  ],
                  'vehicles/car parts': [
                    { name: 'Engine & Drivetrain', spritePos: '0%' },
                    { name: 'Exterior Accessories', spritePos: '20%' },
                    { name: 'Oils & Fluids', spritePos: '40%' },
                    { name: 'Safety & Security', spritePos: '60%' },
                    { name: 'Wheels & Parts', spritePos: '80%' },
                    { name: 'Headlights & Lighting', spritePos: '100%' }
                  ],
                  'vehicles/accessories': [
                    { name: 'Engine & Drivetrain', spritePos: '0%' },
                    { name: 'Exterior Accessories', spritePos: '20%' },
                    { name: 'Oils & Fluids', spritePos: '40%' },
                    { name: 'Safety & Security', spritePos: '60%' },
                    { name: 'Wheels & Parts', spritePos: '80%' },
                    { name: 'Headlights & Lighting', spritePos: '100%' }
                  ],
                  'vehicles/motorcycles & scooters': [
                    { name: 'Yamaha', logo: 'https://www.logo.wine/a/logo/Yamaha_Motor_Company/Yamaha_Motor_Company-Logo.wine.svg' },
                    { name: 'Honda', logo: 'https://www.logo.wine/a/logo/Honda/Honda-Logo.wine.svg' },
                    { name: 'Kawasaki', logo: 'https://www.logo.wine/a/logo/Kawasaki_Heavy_Industries/Kawasaki_Heavy_Industries-Logo.wine.svg' },
                    { name: 'Ducati', logo: 'https://www.logo.wine/a/logo/Ducati_Motor_Holding_S.p.A./Ducati_Motor_Holding_S.p.A.-Logo.wine.svg' },
                    { name: 'Harley-Davidson', logo: 'https://www.logo.wine/a/logo/Harley-Davidson/Harley-Davidson-Logo.wine.svg' },
                    { name: 'Suzuki', logo: 'https://www.logo.wine/a/logo/Suzuki/Suzuki-Logo.wine.svg' }
                  ],
                  'toys & games': [
                    { name: 'LEGO', logo: 'https://www.logo.wine/a/logo/Lego/Lego-Logo.wine.svg' },
                    { name: 'Nintendo', logo: 'https://www.logo.wine/a/logo/Nintendo/Nintendo-Logo.wine.svg' },
                    { name: 'PlayStation', logo: 'https://www.logo.wine/a/logo/PlayStation/PlayStation-Logo.wine.svg' },
                    { name: 'Xbox', logo: 'https://www.logo.wine/a/logo/Xbox/Xbox-Logo.wine.svg' },
                    { name: 'Hasbro', logo: 'https://www.logo.wine/a/logo/Hasbro/Hasbro-Logo.wine.svg' },
                    { name: 'Mattel', logo: 'https://www.logo.wine/a/logo/Mattel/Mattel-Logo.wine.svg' }
                  ],
                  'automotive': [
                    { name: 'Audi', logo: 'https://www.logo.wine/a/logo/Audi/Audi-Logo.wine.svg' },
                    { name: 'BMW', logo: 'https://www.logo.wine/a/logo/BMW/BMW-Logo.wine.svg' },
                    { name: 'Ford', logo: 'https://www.logo.wine/a/logo/Ford_Motor_Company/Ford_Motor_Company-Logo.wine.svg' },
                    { name: 'Mercedes Benz', logo: 'https://www.logo.wine/a/logo/Mercedes-Benz/Mercedes-Benz-Logo.wine.svg' },
                    { name: 'Volkswagen', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Volkswagen_logo_2019.svg/300px-Volkswagen_logo_2019.svg.png' },
                    { name: 'Toyota', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Toyota_EU.svg/300px-Toyota_EU.svg.png' }
                  ],
                  'global': [
                    { name: 'Apple', logo: 'https://www.logo.wine/a/logo/Apple_Inc./Apple_Inc.-Logo.wine.svg' },
                    { name: 'Samsung', logo: 'https://www.logo.wine/a/logo/Samsung/Samsung-Logo.wine.svg' },
                    { name: 'Nike', logo: 'https://www.logo.wine/a/logo/Nike%2C_Inc./Nike%2C_Inc.-Logo.wine.svg' },
                    { name: 'Amazon', logo: 'https://www.logo.wine/a/logo/Amazon_(company)/Amazon_(company)-Logo.wine.svg' },
                    { name: 'IKEA', logo: 'https://www.logo.wine/a/logo/IKEA/IKEA-Logo.wine.svg' },
                    { name: 'Sony', logo: 'https://www.logo.wine/a/logo/Sony/Sony-Logo.wine.svg' }
                  ]
                };

                const categoryKey = displayCategoryName.toLowerCase();
                const subcategoryKey = subcategoryParam ? `${categoryKey}/${subcategoryParam.toLowerCase()}` : null;
                const currentBrands = brandMap[subcategoryKey] || brandMap[categoryKey] || brandMap['global'];

                if (!currentBrands) return null;

                return (
                  <div className="mb-6 grid grid-cols-3 sm:grid-cols-6 gap-3">
                    {currentBrands.map((brand) => (
                      <div
                        key={brand.name}
                        onClick={() => {
                          const url = `/category/${encodeURIComponent(decodedCategoryName)}?search=${encodeURIComponent(brand.name)}`;
                          navigate(url);
                        }}
                        className="flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group py-2"
                      >
                        <div className="h-10 w-full flex items-center justify-center">
                          {brand.spritePos ? (
                            <div
                              className="w-12 h-12 rounded-full bg-no-repeat bg-white shadow-sm border border-gray-100"
                              style={{
                                backgroundImage: 'url(/assets/car_parts_sprite.png)',
                                backgroundPosition: `${brand.spritePos} 12%`, // Match sidebar logic to center the icon part
                                backgroundSize: '600% auto', // 6 items horizontal
                              }}
                            />
                          ) : (
                            <img
                              src={brand.logo}
                              alt={brand.name}
                              className="max-h-full max-w-full object-contain transition-all duration-300 group-hover:scale-110"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                        </div>
                        <span className="text-[10px] sm:text-[11px] font-black text-gray-700 uppercase tracking-wider transition-colors group-hover:text-gray-900 text-center leading-tight">{brand.name}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* BrandDay Banner */}
              <div className="bg-[#007aff] text-white p-3 flex items-center justify-center gap-4 mb-4 rounded-sm">
                <div className="flex items-baseline gap-1">
                  <span className="font-bold italic text-lg text-yellow-300">BrandDay</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium">
                  <span>Ends :</span>
                  <div className="flex items-center gap-1">
                    <span className="bg-white text-black px-1.5 py-0.5 rounded-sm font-bold min-w-[24px] text-center">13</span>
                    <span className="font-bold">:</span>
                    <span className="bg-white text-black px-1.5 py-0.5 rounded-sm font-bold min-w-[24px] text-center">36</span>
                    <span className="font-bold">:</span>
                    <span className="bg-white text-black px-1.5 py-0.5 rounded-sm font-bold min-w-[24px] text-center">56</span>
                  </div>
                </div>
              </div>

              {/* Sort Bar */}
              <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 mb-4 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing <span className="font-bold text-gray-900">{filteredProducts.length}</span> results
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">Sort by:</span>
                  <div className="flex items-center gap-1 text-sm font-medium">
                    <button className="px-3 py-1.5 border border-gray-300 bg-white text-gray-900 rounded hover:bg-gray-50 transition-colors font-semibold">Best Match</button>
                    <button className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 rounded transition-colors">Orders</button>
                    <button className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 rounded transition-colors flex items-center gap-1">
                      Price 1L
                    </button>
                  </div>
                </div>
              </div>

              {/* Product Grid */}
              <div className="min-h-[400px]">
                {loading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="bg-gray-100 animate-pulse rounded-xl aspect-[3/4]" />
                    ))}
                  </div>
                ) : filteredProducts.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredProducts.map((product, index) => (
                      <React.Fragment key={product.id}>
                        <ProductCard product={product} />
                        {/* Insert promo banner after every 8 products */}
                        {(index + 1) % 8 === 0 && index < filteredProducts.length - 1 && (
                          <CategoryPromoBanner
                            products={products.filter(p => (p.isSuperDeal || (p.isFromDatabase && p.discount && p.discount > 0)) && (p.images?.[0] || p.image))}
                            title="SuperDeals"
                          />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-lg p-12 text-center border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">🔍</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No products found</h3>
                    <p className="text-gray-500 mb-6">
                      {subcategoryParam
                        ? `No products found in "${subcategoryParam}".`
                        : "Try adjusting your filters or browse other categories."}
                    </p>
                    <Link to="/shop" className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm">
                      View All Products
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

