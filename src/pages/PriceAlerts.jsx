import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellRing, BellOff, Trash2, Package, TrendingDown, X } from 'lucide-react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { priceAlertService } from '../services/priceAlertService';
import { useToast } from '../contexts/ToastContext';

export default function PriceAlerts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { push: pushToast } = useToast();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'active', 'paused', 'notified'

  useEffect(() => {
    if (user) {
      loadAlerts();
    } else {
      navigate('/login');
    }
  }, [user]);

  const loadAlerts = async () => {
    if (!user) return;

    setLoading(true);
    const result = await priceAlertService.getUserPriceAlerts(user.id);
    
    if (result.success) {
      setAlerts(result.data || []);
    } else {
      pushToast({
        type: 'error',
        title: 'Error',
        message: result.error || 'Failed to load price alerts',
      });
    }
    setLoading(false);
  };

  const handleDeleteAlert = async (alertId) => {
    const result = await priceAlertService.deletePriceAlert(alertId);
    
    if (result.success) {
      setAlerts(alerts.filter(a => a.id !== alertId));
      pushToast({
        type: 'success',
        title: 'Alert Removed',
        message: 'Price alert has been removed',
      });
    } else {
      pushToast({
        type: 'error',
        title: 'Error',
        message: result.error || 'Failed to remove alert',
      });
    }
  };

  const handleToggleActive = async (alert) => {
    const result = await priceAlertService.toggleAlertStatus(alert.id, !alert.is_active);
    
    if (result.success) {
      setAlerts(alerts.map(a => a.id === alert.id ? result.data : a));
      pushToast({
        type: 'success',
        title: alert.is_active ? 'Alert Paused' : 'Alert Activated',
        message: alert.is_active 
          ? 'You will not receive notifications until reactivated'
          : 'You will be notified when price drops',
      });
    } else {
      pushToast({
        type: 'error',
        title: 'Error',
        message: result.error || 'Failed to update alert',
      });
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'active') return alert.is_active && !alert.is_notified;
    if (activeFilter === 'paused') return !alert.is_active;
    if (activeFilter === 'notified') return alert.is_notified;
    return true;
  });

  const getProductImage = (product) => {
    if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0];
    }
    if (product?.image_url) {
      if (Array.isArray(product.image_url)) {
        return product.image_url[0];
      }
      return product.image_url;
    }
    return `data:image/svg+xml;base64,${btoa(`<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#f3f4f6"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>`)}`;
  };

  const calculateDiscount = (currentPrice, targetPrice) => {
    if (!currentPrice || !targetPrice) return 0;
    const current = parseFloat(currentPrice);
    const target = parseFloat(targetPrice);
    return Math.round(((current - target) / current) * 100);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <BellRing className="w-10 h-10 text-blue-600" />
            Price Drop Alerts
          </h1>
          <p className="text-gray-600">
            Get notified when products you're watching drop in price
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            All ({alerts.length})
          </button>
          <button
            onClick={() => setActiveFilter('active')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeFilter === 'active'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            Active ({alerts.filter(a => a.is_active && !a.is_notified).length})
          </button>
          <button
            onClick={() => setActiveFilter('paused')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeFilter === 'paused'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            Paused ({alerts.filter(a => !a.is_active).length})
          </button>
          <button
            onClick={() => setActiveFilter('notified')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeFilter === 'notified'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            Notified ({alerts.filter(a => a.is_notified).length})
          </button>
        </div>

        {/* Alerts List */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your price alerts...</p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <BellOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Price Alerts</h3>
            <p className="text-gray-600 mb-6">
              {activeFilter === 'all'
                ? "You haven't created any price alerts yet. Start watching products to get notified when prices drop!"
                : `No ${activeFilter} alerts found.`}
            </p>
            <button
              onClick={() => navigate('/shop')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Browse Products
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredAlerts.map((alert) => {
              const product = alert.product;
              const currentPrice = parseFloat(product?.price || alert.current_price || 0);
              const targetPrice = parseFloat(alert.target_price || 0);
              const discount = calculateDiscount(currentPrice, targetPrice);

              return (
                <div
                  key={alert.id}
                  className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-200 hover:shadow-xl ${
                    alert.is_notified ? 'ring-2 ring-green-500' : ''
                  } ${!alert.is_active ? 'opacity-75' : ''}`}
                >
                  {/* Product Image */}
                  <div className="relative h-48 bg-gray-100">
                    <img
                      src={getProductImage(product)}
                      alt={product?.name || 'Product'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = `data:image/svg+xml;base64,${btoa(`<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#f3f4f6"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" fill="#9ca3af" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>`)}`;
                      }}
                    />
                    {alert.is_notified && (
                      <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" />
                        Price Dropped!
                      </div>
                    )}
                    {!alert.is_active && (
                      <div className="absolute top-3 left-3 bg-gray-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                        Paused
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-5">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {product?.name || 'Product'}
                    </h3>

                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Current Price</span>
                        <span className="text-lg font-bold text-gray-900">
                          ${currentPrice.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Target Price</span>
                        <span className="text-lg font-bold text-blue-600">
                          ${targetPrice.toFixed(2)}
                        </span>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-blue-900">Save</span>
                          <span className="text-lg font-bold text-blue-600">
                            {discount}% off
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleToggleActive(alert)}
                        className={`flex-1 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                          alert.is_active
                            ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                        }`}
                      >
                        {alert.is_active ? (
                          <>
                            <BellOff className="w-4 h-4 inline mr-1" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Bell className="w-4 h-4 inline mr-1" />
                            Activate
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => navigate(`/product/${product?.id || alert.product_id}`)}
                        className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
                      >
                        View Product
                      </button>
                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}





