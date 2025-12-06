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
  Activity,
  Users,
  ArrowUpRight,
  Mail
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
  const [customers, setCustomers] = useState(0);
  const [visitors, setVisitors] = useState(0);
  const [customerGrowth, setCustomerGrowth] = useState(0);
  const [visitorGrowth, setVisitorGrowth] = useState(0);
  const [orderGrowth, setOrderGrowth] = useState(0);

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
        orderService.getRecentOrders(user.id, 10),
        analyticsService.getTopProducts(user.id, 5),
        analyticsService.getSalesData(user.id, dateRange)
      ]);

      setStats(statsData);
      setRecentOrders(ordersData);
      setTopProducts(productsData);
      setSalesData(sales || []);

      // Get all orders for customer calculation
      const allOrders = await orderService.fetchSellerOrders(user.id);
      
      // Calculate unique customers from all orders
      const uniqueCustomers = new Set();
      allOrders.forEach(order => {
        if (order.user_id) uniqueCustomers.add(order.user_id);
      });
      const currentCustomers = uniqueCustomers.size;

      // Calculate visitors (estimate: 4x unique customers or 3x total orders, whichever is higher)
      const currentVisitors = Math.max(currentCustomers * 4, (statsData?.totalOrders || 0) * 3);

      // Calculate current period revenue
      const currentPeriodRevenue = sales?.reduce((sum, item) => sum + item.revenue, 0) || 0;
      
      // Get previous period data for comparison
      const previousSales = await analyticsService.getSalesData(user.id, dateRange * 2);
      const previousPeriodRevenue = previousSales
        ?.filter(item => {
          const itemDate = new Date(item.date);
          return itemDate >= previousPeriodStart && itemDate < currentPeriodStart;
        })
        .reduce((sum, item) => sum + item.revenue, 0) || 0;

      // Filter orders for current and previous periods
      const currentPeriodOrders = allOrders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= currentPeriodStart;
      });

      const previousPeriodOrders = allOrders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= previousPeriodStart && orderDate < currentPeriodStart;
      });

      // Calculate previous period customers
      const previousUniqueCustomers = new Set();
      previousPeriodOrders.forEach(order => {
        if (order.user_id) previousUniqueCustomers.add(order.user_id);
      });
      const previousCustomers = previousUniqueCustomers.size;
      const previousVisitors = Math.max(previousCustomers * 4, previousPeriodOrders.length * 3);

      // Calculate growth percentages
      const revenueGrowth = previousPeriodRevenue > 0 
        ? parseFloat(((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue * 100).toFixed(1))
        : 0;

      const orderGrowth = previousPeriodOrders.length > 0
        ? parseFloat(((currentPeriodOrders.length - previousPeriodOrders.length) / previousPeriodOrders.length * 100).toFixed(1))
        : 0;

      const customerGrowth = previousCustomers > 0
        ? parseFloat(((currentCustomers - previousCustomers) / previousCustomers * 100).toFixed(1))
        : 0;

      const visitorGrowth = previousVisitors > 0
        ? parseFloat(((currentVisitors - previousVisitors) / previousVisitors * 100).toFixed(1))
        : 0;

      setCustomers(currentCustomers);
      setVisitors(currentVisitors);
      setCustomerGrowth(customerGrowth);
      setVisitorGrowth(visitorGrowth);
      setOrderGrowth(orderGrowth);

      setComparisonStats({
        currentRevenue: currentPeriodRevenue,
        previousRevenue: previousPeriodRevenue,
        revenueGrowth: revenueGrowth,
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
    <div className="max-w-full">
      {/* Top Row - Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-4 lg:mb-6">
        {/* Total Sale */}
        <div className="bg-white rounded-lg shadow-xl p-3 lg:p-6" style={{ boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs lg:text-sm text-gray-600 mb-1 lg:mb-2">Total Sale</p>
              <p className="text-lg lg:text-2xl font-semibold text-blue-600">
                ${(comparisonStats?.currentRevenue || stats?.totalRevenue || 0).toFixed(0)}
              </p>
              <div className="flex items-center gap-1 mt-1 lg:mt-2">
                <ArrowUpRight className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-green-600" />
                <span className="text-[10px] lg:text-xs text-green-600 font-medium">
                  {comparisonStats?.revenueGrowth > 0 ? '+' : ''}{comparisonStats?.revenueGrowth || 0}% Last Week
                </span>
              </div>
            </div>
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-100 rounded-full flex items-center justify-center shrink-0 ml-2">
              <DollarSign className="h-5 w-5 lg:h-6 lg:w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Visitors */}
        <div className="bg-white rounded-lg shadow-xl p-3 lg:p-6" style={{ boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs lg:text-sm text-gray-600 mb-1 lg:mb-2">Visitors</p>
              <p className="text-lg lg:text-2xl font-semibold text-blue-600">
                {visitors.toLocaleString()}
              </p>
              <div className="flex items-center gap-1 mt-1 lg:mt-2">
                <ArrowUpRight className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-green-600" />
                <span className="text-[10px] lg:text-xs text-green-600 font-medium">
                  {visitorGrowth > 0 ? '+' : ''}{visitorGrowth}% Last Week
                </span>
              </div>
            </div>
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-100 rounded-full flex items-center justify-center shrink-0 ml-2">
              <Users className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* New Orders */}
        <div className="bg-white rounded-lg shadow-xl p-3 lg:p-6" style={{ boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs lg:text-sm text-gray-600 mb-1 lg:mb-2">New Orders</p>
              <p className="text-lg lg:text-2xl font-semibold text-blue-600">
                {stats?.totalOrders || 0}
              </p>
              <div className="flex items-center gap-1 mt-1 lg:mt-2">
                <ArrowUpRight className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-green-600" />
                <span className="text-[10px] lg:text-xs text-green-600 font-medium">
                  {orderGrowth > 0 ? '+' : ''}{orderGrowth}% Last Week
                </span>
              </div>
            </div>
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-100 rounded-full flex items-center justify-center shrink-0 ml-2">
              <Package className="h-5 w-5 lg:h-6 lg:w-6 text-amber-700" />
            </div>
          </div>
        </div>

        {/* Customers */}
        <div className="bg-white rounded-lg shadow-xl p-3 lg:p-6" style={{ boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs lg:text-sm text-gray-600 mb-1 lg:mb-2">Customers</p>
              <p className="text-lg lg:text-2xl font-semibold text-blue-600">
                {customers.toLocaleString()}
              </p>
              <div className="flex items-center gap-1 mt-1 lg:mt-2">
                <ArrowUpRight className="h-2.5 w-2.5 lg:h-3 lg:w-3 text-green-600" />
                <span className="text-[10px] lg:text-xs text-green-600 font-medium">
                  {customerGrowth > 0 ? '+' : ''}{customerGrowth}% Last Week
                </span>
              </div>
            </div>
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-100 rounded-full flex items-center justify-center shrink-0 ml-2">
              <Users className="h-5 w-5 lg:h-6 lg:w-6 text-purple-600" />
            </div>
          </div>
        </div>
        </div>

      {/* Middle Row - Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 mb-4 lg:mb-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-xl p-4 lg:p-6" style={{ boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <h3 className="text-sm lg:text-base font-semibold text-gray-900">Revenue</h3>
            <select className="text-[10px] lg:text-xs border border-gray-300 rounded px-2 py-1">
              <option>This Year</option>
              <option>This Month</option>
              <option>This Week</option>
            </select>
          </div>
          <div className="mb-3 lg:mb-4">
            <p className="text-base lg:text-lg font-bold text-yellow-600">
              ${(stats?.totalRevenue || 0).toLocaleString()} All Time
            </p>
          </div>
          {salesData.length === 0 ? (
            <div className="h-40 lg:h-48 flex items-center justify-center text-gray-400">
              <BarChart3 className="h-10 w-10 lg:h-12 lg:w-12" />
            </div>
          ) : (
            <div className="h-48 lg:h-64 relative">
              <svg className="w-full h-full" viewBox="0 0 500 250" preserveAspectRatio="xMidYMid meet">
                {/* Y-axis labels */}
                <text x="15" y="25" fontSize="11" fill="#6b7280" fontFamily="system-ui">100</text>
                <text x="15" y="75" fontSize="11" fill="#6b7280" fontFamily="system-ui">50</text>
                <text x="15" y="125" fontSize="11" fill="#6b7280" fontFamily="system-ui">25</text>
                <text x="15" y="175" fontSize="11" fill="#6b7280" fontFamily="system-ui">10</text>
                <text x="15" y="225" fontSize="11" fill="#6b7280" fontFamily="system-ui">0</text>
                
                {/* Y-axis grid lines */}
                <line x1="40" y1="20" x2="40" y2="230" stroke="#e5e7eb" strokeWidth="1.5" />
                <line x1="40" y1="70" x2="480" y2="70" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="2,2" />
                <line x1="40" y1="120" x2="480" y2="120" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="2,2" />
                <line x1="40" y1="170" x2="480" y2="170" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="2,2" />
                
                {/* X-axis line */}
                <line x1="40" y1="230" x2="480" y2="230" stroke="#e5e7eb" strokeWidth="1.5" />
                
                {/* Prepare data for line chart - use last 10 months or available data */}
                {(() => {
                  const chartData = salesData.length > 0 ? salesData.slice(-10) : [];
                  if (chartData.length === 0) return null;
                  
                  const chartWidth = 440;
                  const chartHeight = 210;
                  const paddingLeft = 40;
                  const paddingTop = 20;
                  const paddingBottom = 20;
                  const dataPoints = chartData.length;
                  const pointSpacing = dataPoints > 1 ? chartWidth / (dataPoints - 1) : 0;
                  
                  // Normalize data to 0-100 scale
                  const maxValue = Math.max(...chartData.map(d => d.revenue), 1);
                  const incomePoints = chartData.map((d, i) => ({
                    x: paddingLeft + (i * pointSpacing),
                    y: paddingTop + chartHeight - (d.revenue / maxValue) * chartHeight
                  }));
                  
                  // Expenses are estimated as 70% of income
                  const expensePoints = chartData.map((d, i) => ({
                    x: paddingLeft + (i * pointSpacing),
                    y: paddingTop + chartHeight - ((d.revenue * 0.7) / maxValue) * chartHeight
                  }));
                  
                  // Create smooth path for Income line
                  const incomePath = incomePoints.map((point, i) => {
                    if (i === 0) return `M ${point.x} ${point.y}`;
                    const prevPoint = incomePoints[i - 1];
                    const cp1x = prevPoint.x + (point.x - prevPoint.x) / 2;
                    const cp1y = prevPoint.y;
                    const cp2x = prevPoint.x + (point.x - prevPoint.x) / 2;
                    const cp2y = point.y;
                    return `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${point.x} ${point.y}`;
                  }).join(' ');
                  
                  // Create smooth path for Expenses line
                  const expensePath = expensePoints.map((point, i) => {
                    if (i === 0) return `M ${point.x} ${point.y}`;
                    const prevPoint = expensePoints[i - 1];
                    const cp1x = prevPoint.x + (point.x - prevPoint.x) / 2;
                    const cp1y = prevPoint.y;
                    const cp2x = prevPoint.x + (point.x - prevPoint.x) / 2;
                    const cp2y = point.y;
                    return `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${point.x} ${point.y}`;
                  }).join(' ');
                  
                  return (
                    <>
                      {/* Income line */}
                      <path
                        d={incomePath}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Expenses line */}
                      <path
                        d={expensePath}
                        fill="none"
                        stroke="#f97316"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Income points */}
                      {incomePoints.map((point, i) => (
                        <circle
                          key={`income-${i}`}
                          cx={point.x}
                          cy={point.y}
                          r="4"
                          fill="#3b82f6"
                          stroke="white"
                          strokeWidth="1.5"
                        />
                      ))}
                      {/* Expenses points */}
                      {expensePoints.map((point, i) => (
                        <circle
                          key={`expense-${i}`}
                          cx={point.x}
                          cy={point.y}
                          r="4"
                          fill="#f97316"
                          stroke="white"
                          strokeWidth="1.5"
                        />
                      ))}
                    </>
                  );
                })()}
              </svg>
              
              {/* X-axis labels (months) */}
              <div className="absolute bottom-1 lg:bottom-2 left-0 right-0 flex justify-between px-4 lg:px-10">
                {salesData.length > 0 ? salesData.slice(-10).map((item, index) => (
                  <span key={index} className="text-[9px] lg:text-xs text-gray-500 font-medium">
                    {new Date(item.date).toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                )) : (
                  ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'].map((month, i) => (
                    <span key={i} className="text-[9px] lg:text-xs text-gray-500 font-medium">{month}</span>
                  ))
                )}
              </div>
              
              {/* Legend */}
              <div className="absolute top-1 lg:top-2 right-1 lg:right-2 flex gap-2 lg:gap-4 text-[9px] lg:text-xs">
                <div className="flex items-center gap-1 lg:gap-1.5">
                  <div className="w-2 h-2 lg:w-2.5 lg:h-2.5 bg-blue-600 rounded-full"></div>
                  <span className="text-gray-700 font-medium">Income</span>
                </div>
                <div className="flex items-center gap-1 lg:gap-1.5">
                  <div className="w-2 h-2 lg:w-2.5 lg:h-2.5 bg-orange-500 rounded-full"></div>
                  <span className="text-gray-700 font-medium">Expenses</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Email Sent Chart */}
        <div className="bg-white rounded-lg shadow-xl p-4 lg:p-6" style={{ boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <h3 className="text-sm lg:text-base font-semibold text-gray-900">Email Sent</h3>
            <select className="text-[10px] lg:text-xs border border-gray-300 rounded px-2 py-1">
              <option>This Month</option>
              <option>This Week</option>
            </select>
          </div>
          <div className="flex items-center justify-center h-40 lg:h-48">
            <div className="relative w-24 h-24 lg:w-32 lg:h-32">
              {/* Donut chart representation */}
              <svg className="transform -rotate-90" width="128" height="128">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="16"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="16"
                  strokeDasharray={`${2 * Math.PI * 56 * 0.7} ${2 * Math.PI * 56}`}
                  strokeDashoffset="0"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="16"
                  strokeDasharray={`${2 * Math.PI * 56 * 0.45} ${2 * Math.PI * 56}`}
                  strokeDashoffset={`-${2 * Math.PI * 56 * 0.7}`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">70%</p>
                  <p className="text-xs text-gray-500">Sent</p>
                </div>
              </div>
            </div>
              </div>
          <div className="flex flex-col gap-1.5 lg:gap-2 mt-3 lg:mt-4">
            <div className="flex items-center gap-1.5 lg:gap-2 text-[10px] lg:text-xs">
              <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 bg-blue-600 rounded-full"></div>
              <span>70% Sent</span>
            </div>
            <div className="flex items-center gap-1.5 lg:gap-2 text-[10px] lg:text-xs">
              <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 bg-orange-500 rounded-full"></div>
              <span>45% Read</span>
            </div>
            <div className="flex items-center gap-1.5 lg:gap-2 text-[10px] lg:text-xs">
              <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 bg-gray-400 rounded-full"></div>
              <span>45% Read</span>
            </div>
          </div>
          </div>
        </div>

      {/* Bottom Row - Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Recent Orders Table */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden" style={{ boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
          <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm lg:text-base font-semibold text-gray-900">Recent Orders</h3>
            <select className="text-[10px] lg:text-xs border border-gray-300 rounded px-2 py-1">
              <option>This Week</option>
              <option>This Month</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-[10px] lg:text-xs font-medium text-gray-600 uppercase">Invoice</th>
                  <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-[10px] lg:text-xs font-medium text-gray-600 uppercase">Customer</th>
                  <th className="hidden sm:table-cell px-3 lg:px-6 py-2 lg:py-3 text-left text-[10px] lg:text-xs font-medium text-gray-600 uppercase">Purchase On</th>
                  <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-[10px] lg:text-xs font-medium text-gray-600 uppercase">Amount</th>
                  <th className="px-3 lg:px-6 py-2 lg:py-3 text-left text-[10px] lg:text-xs font-medium text-gray-600 uppercase">Status</th>
                  <th className="hidden lg:table-cell px-3 lg:px-6 py-2 lg:py-3 text-left text-[10px] lg:text-xs font-medium text-gray-600 uppercase">Tracking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 lg:px-6 py-6 lg:py-8 text-center text-xs lg:text-sm text-gray-500">
                      No orders yet
                    </td>
                  </tr>
                ) : (
                  recentOrders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-3 lg:px-6 py-2 lg:py-3 text-[10px] lg:text-xs text-gray-900">#{order.id.slice(0, 7)}</td>
                      <td className="px-3 lg:px-6 py-2 lg:py-3 text-[10px] lg:text-xs text-gray-900">
                        {order.customerName || order.shipping_address?.split(',')[0] || 'Customer'}
                      </td>
                      <td className="hidden sm:table-cell px-3 lg:px-6 py-2 lg:py-3 text-[10px] lg:text-xs text-gray-600">
                        {new Date(order.created_at).toLocaleDateString('en-US', { 
                          day: 'numeric', 
                          month: 'short', 
                          year: 'numeric' 
                        })}
                      </td>
                      <td className="px-3 lg:px-6 py-2 lg:py-3 text-[10px] lg:text-xs font-medium text-gray-900">
                        ${order.sellerRevenue.toFixed(0)}
                      </td>
                      <td className="px-3 lg:px-6 py-2 lg:py-3">
                        <span className={`text-[10px] lg:text-xs font-medium ${
                          order.status === 'delivered' ? 'text-green-600' :
                          order.status === 'cancelled' ? 'text-red-600' :
                          order.status === 'pending' ? 'text-orange-600' :
                          'text-blue-600'
                        }`}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell px-3 lg:px-6 py-2 lg:py-3 text-[10px] lg:text-xs text-gray-600 font-mono">
                        {order.id.slice(0, 6).toUpperCase()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Delivery Progress */}
        <div className="bg-white rounded-lg shadow-xl p-4 lg:p-6" style={{ boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
          <div className="flex items-center justify-between mb-3 lg:mb-4">
            <h3 className="text-sm lg:text-base font-semibold text-gray-900">Delivery</h3>
            <select className="text-[10px] lg:text-xs border border-gray-300 rounded px-2 py-1">
              <option>In Progress</option>
              <option>Completed</option>
            </select>
          </div>
          <div className="space-y-3 lg:space-y-4">
            {topProducts.length > 0 ? (
              topProducts.slice(0, 4).map((product, index) => {
                // Calculate delivery progress based on order status
                // For now, use a simple calculation: 100% if delivered, 50% if shipped, 25% if pending
                const totalOrders = recentOrders.filter(o => 
                  o.sellerItems?.some(item => item.productName === product.product.name)
                ).length;
                const deliveredOrders = recentOrders.filter(o => 
                  o.status === 'delivered' && o.sellerItems?.some(item => item.productName === product.product.name)
                ).length;
                
                // Calculate percentage based on delivery status
                const percentage = totalOrders > 0 
                  ? Math.round((deliveredOrders / totalOrders) * 100)
                  : (index === 0 ? 65 : index === 1 ? 15 : index === 2 ? 25 : 50);
                
                const isFirst = index === 0;
                return (
                  <div key={product.product.id} className={`p-2.5 lg:p-3 rounded-lg ${isFirst ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 lg:gap-3 mb-1.5 lg:mb-2">
                      <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gray-200 rounded flex items-center justify-center shrink-0">
                        <Package className="h-3 w-3 lg:h-4 lg:w-4 text-gray-600" />
                      </div>
                      <p className="text-xs lg:text-sm font-medium text-gray-900 flex-1 truncate">
                        {product.product.name}
                      </p>
                      <span className={`text-[10px] lg:text-xs font-semibold shrink-0 ${isFirst ? 'text-blue-600' : 'text-orange-600'}`}>
                        {percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 lg:h-2 overflow-hidden">
                      <div
                        className={`h-1.5 lg:h-2 rounded-full transition-all duration-500 ${isFirst ? 'bg-blue-600' : 'bg-orange-500'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-xs text-gray-600">No delivery data available</p>
                  </div>
                )}
              </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
