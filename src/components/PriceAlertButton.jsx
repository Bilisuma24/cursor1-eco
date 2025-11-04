import React, { useState, useEffect } from 'react';
import { Bell, BellRing, X } from 'lucide-react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { priceAlertService } from '../services/priceAlertService';
import { useToast } from '../contexts/ToastContext';

export default function PriceAlertButton({ product, currentPrice }) {
  const { user } = useAuth();
  const { push: pushToast } = useToast();
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');
  const [tableExists, setTableExists] = useState(true); // Assume it exists until proven otherwise

  useEffect(() => {
    if (user && product?.id && tableExists) {
      loadAlert();
    } else {
      setAlert(null);
    }
  }, [user, product?.id, tableExists]);

  const loadAlert = async () => {
    if (!user || !product?.id) return;

    try {
      const result = await priceAlertService.getProductAlert(user.id, product.id);
      if (result.tableExists === false) {
        setTableExists(false);
        return;
      }
      if (result.success && result.data) {
        setAlert(result.data);
        setTargetPrice(result.data.target_price.toString());
      } else {
        setAlert(null);
        setTargetPrice('');
      }
      // If we got a result (even if null), table exists
      setTableExists(true);
    } catch (error) {
      // Check if error is due to table not existing (406 or PGRST205)
      if (error?.status === 406 || error?.code === 'PGRST205' || error?.message?.includes('Not Acceptable')) {
        setTableExists(false);
      }
      setAlert(null);
      setTargetPrice('');
    }
  };

  const handleCreateAlert = async () => {
    if (!user) {
      pushToast({
        type: 'warning',
        title: 'Login Required',
        message: 'Please log in to set price alerts',
      });
      return;
    }

    if (!targetPrice || parseFloat(targetPrice) <= 0) {
      pushToast({
        type: 'error',
        title: 'Invalid Price',
        message: 'Please enter a valid target price',
      });
      return;
    }

    const target = parseFloat(targetPrice);
    const price = parseFloat(currentPrice || product.price || 0);

    if (target >= price) {
      pushToast({
        type: 'error',
        title: 'Invalid Target Price',
        message: 'Target price must be lower than current price',
      });
      return;
    }

    setLoading(true);
    const result = await priceAlertService.createPriceAlert(
      user.id,
      product.id,
      target,
      price
    );

    if (result.success) {
      setAlert(result.data);
      setShowModal(false);
      pushToast({
        type: 'success',
        title: 'Price Alert Created',
        message: `You'll be notified when the price drops to $${target.toFixed(2)}`,
      });
    } else {
      // If alert already exists, update it
      if (result.error?.includes('duplicate') || result.error?.includes('unique')) {
        // Try to get existing alert first
        const existingResult = await priceAlertService.getProductAlert(user.id, product.id);
        if (existingResult.success && existingResult.data) {
          const updateResult = await priceAlertService.updatePriceAlert(existingResult.data.id, {
            target_price: target,
            current_price: price,
            is_active: true,
            is_notified: false,
          });
          
          if (updateResult.success) {
            setAlert(updateResult.data);
            setShowModal(false);
            pushToast({
              type: 'success',
              title: 'Price Alert Updated',
              message: `Alert updated to $${target.toFixed(2)}`,
            });
          } else {
            pushToast({
              type: 'error',
              title: 'Error',
              message: updateResult.error || 'Failed to update alert',
            });
          }
        } else {
          pushToast({
            type: 'error',
            title: 'Error',
            message: result.error || 'Failed to create alert',
          });
        }
      } else if (result.error?.includes('not set up') || result.error?.includes('migration')) {
        pushToast({
          type: 'error',
          title: 'Setup Required',
          message: result.error || 'Please run the SQL migration to enable price alerts',
          duration: 5000,
        });
      } else {
        pushToast({
          type: 'error',
          title: 'Error',
          message: result.error || 'Failed to create alert',
        });
      }
    }
    setLoading(false);
  };

  const handleDeleteAlert = async () => {
    if (!alert) return;

    setLoading(true);
    const result = await priceAlertService.deletePriceAlert(alert.id);

    if (result.success) {
      setAlert(null);
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
    setLoading(false);
  };

  const handleToggleActive = async () => {
    if (!alert) return;

    setLoading(true);
    const result = await priceAlertService.toggleAlertStatus(alert.id, !alert.is_active);

    if (result.success) {
      setAlert(result.data);
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
    setLoading(false);
  };

  if (!user) {
    return null; // Don't show for non-logged-in users
  }

  // Don't render if table doesn't exist (feature not set up yet)
  if (!tableExists) {
    return null;
  }

  const price = parseFloat(currentPrice || product.price || 0);

  return (
    <>
      <button
        onClick={() => {
          if (alert) {
            setShowModal(true);
          } else {
            setShowModal(true);
            setTargetPrice((price * 0.9).toFixed(2)); // Suggest 10% off
          }
        }}
        disabled={loading}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
          ${alert?.is_active
            ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        title={alert ? 'Manage Price Alert' : 'Set Price Alert'}
      >
        {alert?.is_active ? (
          <BellRing className="w-5 h-5" />
        ) : (
          <Bell className="w-5 h-5" />
        )}
        <span>{alert ? (alert.is_active ? 'Alert Active' : 'Alert Paused') : 'Set Price Alert'}</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {alert ? 'Manage Price Alert' : 'Create Price Alert'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Price
                </label>
                <div className="text-2xl font-bold text-gray-900">
                  ${price.toFixed(2)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Price (When price drops to)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={price.toFixed(2)}
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  You'll be notified when the price drops to this amount
                </p>
              </div>

              {alert && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Status:</strong> {alert.is_active ? 'Active' : 'Paused'}
                  </p>
                  {alert.target_price && (
                    <p className="text-sm text-blue-800 mt-1">
                      <strong>Target:</strong> ${parseFloat(alert.target_price).toFixed(2)}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                {alert && (
                  <>
                    <button
                      onClick={handleToggleActive}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      {alert.is_active ? 'Pause' : 'Activate'}
                    </button>
                    <button
                      onClick={handleDeleteAlert}
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </>
                )}
                <button
                  onClick={handleCreateAlert}
                  disabled={loading || !targetPrice}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                    alert
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {loading ? 'Saving...' : alert ? 'Update Alert' : 'Create Alert'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

