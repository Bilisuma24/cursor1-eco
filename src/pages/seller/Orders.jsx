import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { orderService } from '../../services/orderService';
import { Search, Filter, Eye, Package, Clock, CheckCircle, Truck, AlertCircle } from 'lucide-react';

const Orders = () => {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  const statusOptions = [
    { value: '', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user, statusFilter]);

  const loadOrders = async () => {
    if (!user?.id) {
      console.log('User not available yet, skipping orders load');
      return;
    }
    
    try {
      setLoading(true);
      const data = await orderService.fetchSellerOrders(user.id, statusFilter || null);
      setOrders(data);
    } catch (err) {
      setError('Failed to load orders');
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      // Reload orders to reflect the change
      await loadOrders();
    } catch (err) {
      setError('Failed to update order status');
      console.error('Error updating order status:', err);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'shipped':
        return <Truck className="h-4 w-4 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'confirmed':
        return 'text-blue-600 bg-blue-100';
      case 'shipped':
        return 'text-purple-600 bg-purple-100';
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'pending':
        return 'confirmed';
      case 'confirmed':
        return 'shipped';
      case 'shipped':
        return 'delivered';
      default:
        return null;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.shipping_address?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Orders
          </h1>
          <p className="text-sm text-gray-500">
            Manage your orders and track their status ({filteredOrders.length} orders)
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl shadow-sm">
          <p className="text-red-800 font-medium">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders by ID or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
        <div className="sm:w-40">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-16">
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-8 inline-block mb-6">
            <Package className="h-16 w-16 text-gray-400 mx-auto" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {searchTerm || statusFilter ? 'No orders found' : 'No orders yet'}
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {searchTerm || statusFilter 
              ? 'Try adjusting your search or filter criteria'
              : 'Orders will appear here when customers purchase your products'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredOrders.map((order) => {
            const nextStatus = getNextStatus(order.status);
            
            return (
              <div key={order.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-4 hover:shadow-sm transition-shadow">
                {/* Header */}
                <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                      <div>
                        <h3 className="text-xs font-semibold text-gray-900">
                          Order #{order.id.slice(0, 8)}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        ${order.sellerRevenue.toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">Your Revenue</p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="px-5 py-3">
                  <h4 className="text-xs font-medium text-gray-900 mb-2">Your Products</h4>
                  <div className="space-y-1.5">
                    {order.sellerItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          {item.productImage && (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="w-8 h-8 rounded object-cover"
                            />
                          )}
                          <div>
                            <p className="text-xs font-medium text-gray-900">{item.productName}</p>
                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-gray-900">
                            ${item.total.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">
                            ${item.price.toFixed(2)} each
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping Address */}
                {order.shipping_address && (
                  <div className="px-5 pb-3">
                    <h4 className="text-xs font-medium text-gray-900 mb-1.5">Shipping Address:</h4>
                    <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">
                      {order.shipping_address}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => {/* TODO: Implement order details modal */}}
                      className="flex items-center space-x-1.5 text-blue-600 hover:text-blue-700 text-xs px-3 py-1.5 rounded hover:bg-blue-50 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>View Details</span>
                    </button>
                    
                    {nextStatus && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, nextStatus)}
                        className="bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 transition-colors text-xs font-medium"
                      >
                        Mark as {nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1)}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;
