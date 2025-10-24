import React, { useState } from "react";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  Star,
  Eye,
  Download,
  MessageCircle,
  RefreshCw
} from "lucide-react";

export default function Orders() {
  const [activeTab, setActiveTab] = useState('all');
  const [orders] = useState([
    {
      id: 'ORD-2024-001',
      date: '2024-01-15',
      status: 'delivered',
      total: 189.98,
      items: [
        {
          id: 1,
          name: 'Wireless Bluetooth Earbuds Pro',
          image: 'https://images.unsplash.com/photo-1606220838315-056192d5e927?w=100&h=100&fit=crop',
          price: 89.99,
          quantity: 1,
          seller: 'TechWorld Store'
        },
        {
          id: 2,
          name: 'Smart Fitness Watch Series 8',
          image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop',
          price: 199.99,
          quantity: 1,
          seller: 'Fitness Gear Pro'
        }
      ],
      tracking: {
        number: 'TRK123456789',
        carrier: 'FedEx',
        estimatedDelivery: '2024-01-18'
      }
    },
    {
      id: 'ORD-2024-002',
      date: '2024-01-12',
      status: 'shipped',
      total: 79.99,
      items: [
        {
          id: 6,
          name: 'Smart Home Security Camera',
          image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop',
          price: 79.99,
          quantity: 1,
          seller: 'Smart Home Solutions'
        }
      ],
      tracking: {
        number: 'TRK987654321',
        carrier: 'UPS',
        estimatedDelivery: '2024-01-20'
      }
    },
    {
      id: 'ORD-2024-003',
      date: '2024-01-10',
      status: 'processing',
      total: 159.99,
      items: [
        {
          id: 3,
          name: 'Premium Leather Handbag',
          image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=100&h=100&fit=crop',
          price: 159.99,
          quantity: 1,
          seller: 'Fashion Forward'
        }
      ]
    }
  ]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-blue-500" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Package className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'shipped':
        return 'text-blue-600 bg-blue-100';
      case 'processing':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'delivered':
        return 'Delivered';
      case 'shipped':
        return 'Shipped';
      case 'processing':
        return 'Processing';
      default:
        return 'Unknown';
    }
  };

  const filteredOrders = activeTab === 'all' 
    ? orders 
    : orders.filter(order => order.status === activeTab);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600">Track and manage your orders</p>
        </div>

        {/* Order Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { key: 'all', label: 'All Orders', count: orders.length },
                { key: 'processing', label: 'Processing', count: orders.filter(o => o.status === 'processing').length },
                { key: 'shipped', label: 'Shipped', count: orders.filter(o => o.status === 'shipped').length },
                { key: 'delivered', label: 'Delivered', count: orders.filter(o => o.status === 'delivered').length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600">You don't have any orders in this category.</p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200">
                {/* Order Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(order.status)}
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Order #{order.id}</h3>
                        <p className="text-sm text-gray-600">Placed on {formatDate(order.date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">{formatPrice(order.total)}</div>
                      <p className="text-sm text-gray-600">{order.items.length} item(s)</p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-6">
                  <div className="space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center space-x-4">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 bg-gray-100 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-600">Sold by {item.seller}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {formatPrice(item.price * item.quantity)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Actions */}
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium">
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </button>
                      
                      {order.status === 'delivered' && (
                        <>
                          <button className="flex items-center space-x-2 text-green-600 hover:text-green-700 font-medium">
                            <Star className="w-4 h-4" />
                            <span>Rate & Review</span>
                          </button>
                          <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-700 font-medium">
                            <RefreshCw className="w-4 h-4" />
                            <span>Reorder</span>
                          </button>
                        </>
                      )}
                      
                      {order.status === 'shipped' && (
                        <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium">
                          <Truck className="w-4 h-4" />
                          <span>Track Package</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200">
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Tracking Info */}
                  {order.tracking && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900">Tracking Number</p>
                          <p className="text-sm text-gray-600">{order.tracking.number}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">Carrier</p>
                          <p className="text-sm text-gray-600">{order.tracking.carrier}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">Estimated Delivery</p>
                          <p className="text-sm text-gray-600">{formatDate(order.tracking.estimatedDelivery)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}