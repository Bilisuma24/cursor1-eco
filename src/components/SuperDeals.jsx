import React, { useState, useEffect } from 'react';
import productsData from '../data/products';
import { Link } from 'react-router-dom';

const SuperDeals = () => {
    const [timeLeft, setTimeLeft] = useState({
        hours: 11,
        minutes: 1,
        seconds: 9
    });

    // Simple countdown timer effect
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
                if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
                if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
                return { hours: 24, minutes: 0, seconds: 0 }; // Remove reset or set to specific logic if needed
            });
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (val) => val.toString().padStart(2, '0');

    // Select 4 random discounted products (or just the first 4 with discount)
    const dealProducts = productsData.products
        .filter(p => p.discount && p.discount > 0)
        .slice(0, 4);

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6 flex flex-col md:flex-row overflow-hidden mx-4 my-4">
            {/* Left Column - Banner */}
            <div className="md:w-1/5 p-6 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-gray-100 bg-white">
                <h2 className="text-xl font-bold text-gray-900 mb-4">SuperDeals</h2>

                <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-sm font-medium mb-6">
                    <span className="w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px]">L</span>
                    <span>Ends in: {formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}</span>
                </div>

                <Link to="/shop?filter=deals" className="bg-black text-white px-6 py-2 rounded font-medium hover:bg-gray-800 transition-colors text-sm">
                    Shop now
                </Link>
            </div>

            {/* Right Column - Products */}
            <div className="md:w-4/5 p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {dealProducts.map(product => (
                        <Link key={product.id} to={`/product/${product.id}`} className="group block">
                            <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden mb-3 relative">
                                <img
                                    src={product.images?.[0] || product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNTAiIGhlaWdodD0iMTUwIj48cmVjdCB3aWR0aD0iMTUwIiBoZWlnaHQ9IjE1MCIgZmlsbD0iI2RiZGJkYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmF5LWJhc2VsaW5lPSJtaWRkbGUiPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==";
                                    }}
                                />
                            </div>

                            <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1 group-hover:text-blue-600 h-10">
                                {product.name}
                            </h3>

                            <div className="flex flex-col">
                                <div className="font-bold text-lg">
                                    {product.currency} {product.price}
                                </div>

                                {product.originalPrice && (
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="text-gray-400 line-through">
                                            {product.currency} {product.originalPrice}
                                        </span>
                                        <span className="text-white bg-red-500 px-1 rounded-[2px] font-bold">
                                            -{product.discount}%
                                        </span>
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SuperDeals;
