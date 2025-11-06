import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { analyticsService } from '../../services/analyticsService';
import { orderService } from '../../services/orderService';
import StatsCard from '../../components/seller/StatsCard';
import LevelBadge from '../../components/achievements/LevelBadge';
import LevelProgress from '../../components/achievements/LevelProgress';
import { getUserLevel } from '../../services/achievementService';
import { 
  DollarSign, 
  Package, 
  ShoppingCart, 
  TrendingUp,
  Clock,
  CheckCircle,
  Truck,
  AlertCircle,
  BarChart3,
  Loader2,
  Calendar,
  Target,
  Activity
} from 'lucide-react';

const Overview = () => {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [level, setLevel] = useState(null);
  const [dateRange, setDateRange] = useState(30); // 7, 30, 90 days
  const [comparisonStats, setComparisonStats] = useState(null);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!user) return;
        const lvl = await getUserLevel(user.id, 'seller');
        if (mounted) setLevel(lvl);
      } catch {}
    })();
    return () => { mounted = false; };
  }, [user]);

  const loadDashboardData = async () => {
    if (!user?.id) {
      console.log('User not available yet, skipping dashboard data load');
      return;
    }
    
    try {
      setLoading(true);
      
      // Calculate comparison period dates
      const now = new Date();
      const currentPeriodStart = new Date(now);
      currentPeriodStart.setDate(currentPeriodStart.getDate() - dateRange);
      
      const previousPeriodStart = new Date(currentPeriodStart);
      previousPeriodStart.setDate(previousPeriodStart.getDate() - dateRange);
      
      // Load all dashboard data in parallel
      const [statsData, ordersData, productsData, sales] = await Promise.all([
        analyticsService.getSellerStats(user.id),
        orderService.getRecentOrders(user.id, 5),
        analyticsService.getTopProducts(user.id, 5),
        analyticsService.getSalesData(user.id, dateRange)
      ]);

      setStats(statsData);
      setRecentOrders(ordersData);
      setTopProducts(productsData);
      setSalesData(sales || []);

      // Calculate comparison stats (current period vs previous period)
      const currentPeriodRevenue = sales?.reduce((sum, item) => sum + item.revenue, 0) || 0;
      
      // Get previous period data for comparison
      const previousSales = await analyticsService.getSalesData(user.id, dateRange * 2);
      const previousPeriodRevenue = previousSales
        ?.filter(item => {
          const itemDate = new Date(item.date);
          return itemDate >= previousPeriodStart && itemDate < currentPeriodStart;
        })
        .reduce((sum, item) => sum + item.revenue, 0) || 0;

      const revenueGrowth = previousPeriodRevenue > 0 
        ? ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue * 100).toFixed(1)
        : 0;

      setComparisonStats({
        currentRevenue: currentPeriodRevenue,
        previousRevenue: previousPeriodRevenue,
        revenueGrowth: parseFloat(revenueGrowth),
        dateRange
      });
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user, dateRange]);

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

  // Calculate growth percentages for stats
  const calculateGrowth = (current, previous) => {
    if (!previous || previous === 0) return null;
    return parseFloat(((current - previous) / previous * 100).toFixed(1));
  };

  const maxRevenue = Math.max(...(salesData.map(item => item.revenue) || [0]), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Dashboard</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={loadDashboardData}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your store.</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {level && (
        <div>
          <LevelBadge levelName={level?.badge?.split('/').pop()?.replace('.svg','')} badge={level?.badge} />
          <div className="mt-2 max-w-md">
            <LevelProgress xp={level?.xp || 0} next={level?.next_level_xp || 100} />
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-emerald-500 p-3 rounded-lg">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            {comparisonStats?.revenueGrowth !== undefined && (
              <div className={`flex items-center gap-1 text-sm font-semibold ${
                comparisonStats.revenueGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {comparisonStats.revenueGrowth >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                {comparisonStats.revenueGrowth > 0 ? '+' : ''}{comparisonStats.revenueGrowth}%
              </div>
            )}
          </div>
          <div className="text-3xl font-bold text-emerald-900 mb-1">
            ${(comparisonStats?.currentRevenue || stats?.totalRevenue || 0).toFixed(2)}
          </div>
          <div className="text-sm font-medium text-emerald-700">Revenue ({dateRange}d)</div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-500 p-3 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <Activity className="h-5 w-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-900 mb-1">
            {stats?.totalOrders || 0}
          </div>
          <div className="text-sm font-medium text-blue-700">Total Orders</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-500 p-3 rounded-lg">
              <Package className="h-6 w-6 text-white" />
            </div>
            <Target className="h-5 w-5 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-purple-900 mb-1">
            {stats?.totalProducts || 0}
          </div>
          <div className="text-sm font-medium text-purple-700">Total Products</div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-orange-500 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <AlertCircle className="h-5 w-5 text-orange-400" />
          </div>
          <div className="text-3xl font-bold text-orange-900 mb-1">
            {stats?.pendingOrders || 0}
          </div>
          <div className="text-sm font-medium text-orange-700">Pending Orders</div>
        </div>
      </div>

      {/* Growth Chart */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Revenue Growth
            </h3>
            <p className="text-sm text-gray-600 mt-1">Sales performance over the last {dateRange} days</p>
          </div>
          {comparisonStats && (
            <div className="text-right">
              <div className="text-sm text-gray-600">Growth Rate</div>
              <div className={`text-2xl font-bold ${
                comparisonStats.revenueGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {comparisonStats.revenueGrowth >= 0 ? '+' : ''}{comparisonStats.revenueGrowth}%
              </div>
            </div>
          )}
        </div>
        {salesData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg">No sales data available yet</p>
            <p className="text-sm mt-2">Start selling to see your revenue growth!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {salesData.map((item) => {
              const percentage = (item.revenue / maxRevenue) * 100;
              return (
                <div key={item.date}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {new Date(item.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: dateRange > 30 ? 'numeric' : undefined
                      })}
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      ${item.revenue.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 hover:from-blue-600 hover:to-blue-700"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Cards */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-gray-600" />
            Order Status Breakdown
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium text-gray-700">Confirmed</span>
              </div>
              <span className="text-lg font-bold text-blue-600">{stats?.confirmedOrders || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Truck className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-medium text-gray-700">Shipped</span>
              </div>
              <span className="text-lg font-bold text-purple-600">{stats?.shippedOrders || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium text-gray-700">Delivered</span>
              </div>
              <span className="text-lg font-bold text-green-600">{stats?.deliveredOrders || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">Pending</span>
              </div>
              <span className="text-lg font-bold text-yellow-600">{stats?.pendingOrders || 0}</span>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-gray-600" />
            Top Selling Products
          </h3>
          {topProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No sales data available yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topProducts.map((product, index) => {
                const maxRevenue = Math.max(...topProducts.map(p => p.totalRevenue), 1);
                const percentage = (product.totalRevenue / maxRevenue) * 100;
                return (
                  <div key={product.product.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{product.product.name}</p>
                          <p className="text-xs text-gray-500">{product.totalQuantity} sold</p>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-gray-900 ml-4">
                        ${product.totalRevenue.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-gray-600" />
            Recent Orders
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {recentOrders.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <ShoppingCart className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No orders yet</p>
            </div>
          ) : (
            recentOrders.map((order) => (
              <div key={order.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(order.status)}
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Order #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      ${order.sellerRevenue.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.sellerItems.length} item{order.sellerItems.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                {order.sellerItems.length > 0 && (
                  <div className="mt-2 ml-6">
                    <p className="text-xs text-gray-500">
                      {order.sellerItems.map(item => `${item.productName} (${item.quantity})`).join(', ')}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Overview;
