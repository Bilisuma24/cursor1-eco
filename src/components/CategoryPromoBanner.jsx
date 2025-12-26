import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

// Countdown Timer Component
function CountdownTimer() {
    const [time, setTime] = useState({ hours: 10, minutes: 50, seconds: 3 });

    useEffect(() => {
        const interval = setInterval(() => {
            setTime(prev => {
                let { hours, minutes, seconds } = prev;

                if (seconds > 0) {
                    seconds--;
                } else if (minutes > 0) {
                    minutes--;
                    seconds = 59;
                } else if (hours > 0) {
                    hours--;
                    minutes = 59;
                    seconds = 59;
                } else {
                    hours = 10;
                    minutes = 50;
                    seconds = 3;
                }

                return { hours, minutes, seconds };
            });
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const pad = (num) => String(num).padStart(2, '0');

    return (
        <span className="font-bold text-sm">
            {pad(time.hours)}:{pad(time.minutes)}:{pad(time.seconds)}
        </span>
    );
}

export default function CategoryPromoBanner({ products, title = "SuperDeals" }) {
    const [currentPage, setCurrentPage] = useState(0);
    const productsPerPage = 4;

    // If no products provided, try to filter from productsData or just don't show
    if (!products || products.length === 0) return null;

    const totalPages = Math.ceil(products.length / productsPerPage);
    const startIndex = currentPage * productsPerPage;
    const visibleProducts = products.slice(startIndex, startIndex + productsPerPage);

    const handlePrevious = () => {
        setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1));
    };

    const handleNext = () => {
        setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0));
    };

    return (
        <div className="col-span-full my-4">
            <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm flex flex-col md:flex-row gap-6 items-center">
                {/* Left Column - Heading & Timer */}
                <div className="w-full md:w-1/4 flex flex-col items-center text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{title}</h3>
                    <div className="flex items-center gap-2 text-sm bg-red-50 text-red-600 px-4 py-1.5 rounded-full mb-4">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        Ends in: <CountdownTimer />
                    </div>
                    <button className="bg-black text-white px-8 py-2 rounded-md font-semibold hover:bg-gray-800 transition-colors">
                        Shop now
                    </button>
                </div>

                {/* Right Column - Products */}
                <div className="w-full md:w-3/4">
                    <div className="relative">
                        {/* Left Arrow */}
                        <button
                            onClick={handlePrevious}
                            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 -ml-4 transition-all"
                        >
                            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl">
                            {visibleProducts.map((product) => (
                                <Link
                                    key={product.id}
                                    to={`/category/${encodeURIComponent(product.category || 'General')}`}
                                    className="group bg-white rounded-lg overflow-hidden hover:shadow-md transition-all border border-gray-50"
                                >
                                    <div className="aspect-square bg-gray-50 relative overflow-hidden">
                                        <img
                                            src={(() => {
                                                const img = product.images?.[0] || product.image;
                                                if (!img) return "";
                                                return img;
                                            })()}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = `data:image/svg+xml;base64,${btoa(`<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="#f3f4f6"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="18" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>`)}`;
                                            }}
                                        />
                                        {product.discount && (
                                            <span className="absolute top-1 left-1 bg-red-500 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">
                                                -{product.discount}%
                                            </span>
                                        )}
                                    </div>
                                    <div className="p-1.5">
                                        <h4 className="text-[10px] font-medium text-gray-900 line-clamp-1 mb-0.5">
                                            {product.category || 'General'}
                                        </h4>
                                        <div className="flex items-baseline gap-0.5">
                                            <span className="text-xs font-bold text-gray-900">
                                                {product.currency}{product.price.toFixed(2)}
                                            </span>
                                            {product.originalPrice && (
                                                <span className="text-[9px] text-gray-400 line-through">
                                                    {product.currency}{product.originalPrice.toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {/* Right Arrow */}
                        <button
                            onClick={handleNext}
                            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg rounded-full p-2 -mr-4 transition-all"
                        >
                            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
