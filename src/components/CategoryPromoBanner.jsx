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
    // If no products provided, try to filter from productsData or just don't show
    if (!products || products.length === 0) return null;

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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
                        {products.slice(0, 4).map((product) => (
                            <Link
                                key={product.id}
                                to={`/category/${encodeURIComponent(product.category || 'General')}`}
                                className="group bg-white rounded-lg overflow-hidden hover:shadow-md transition-all border border-gray-50 max-w-[140px]"
                            >
                                <div className="aspect-square bg-gray-50 relative overflow-hidden">
                                    <img
                                        src={(() => {
                                            const img = product.images?.[0] || product.image;
                                            if (!img) return "";
                                            // If it's a full URL or a relative path that's valid, return it.
                                            // Remove the absolute local path hack as it's not needed for web-accessible images.
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
                </div>
            </div>
        </div>
    );
}
