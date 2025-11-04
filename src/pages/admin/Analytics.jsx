import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { BarChart3, TrendingUp, DollarSign, ShoppingCart, Loader2, Store } from 'lucide-react';

export default function AdminAnalytics() {
  const [daily, setDaily] = useState([]);
  const [topSellers, setTopSellers] = useState([]);
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Aggregate revenue per day across all orders
        const since = new Date();
        since.setDate(since.getDate() - 14);

        const { data: items } = await supabase
          .from('order_items')
          .select('price_at_purchase,quantity,created_at');

        const byDay = {};
        let totalRevenue = 0;
        (items || []).forEach(i => {
          const revenue = (i.price_at_purchase || 0) * (i.quantity || 0);
          totalRevenue += revenue;
          const d = new Date(i.created_at).toISOString().split('T')[0];
          if (!byDay[d]) byDay[d] = 0;
          byDay[d] += revenue;
        });
        
        const sortedDaily = Object.entries(byDay)
          .filter(([date]) => new Date(date) >= since)
          .sort((a,b) => a[0] > b[0] ? 1 : -1)
          .slice(-14);
        setDaily(sortedDaily);

        // Get total orders
        const { count: totalOrders } = await supabase
          .from('order')
          .select('*', { count: 'exact', head: true });

        setStats({
          totalRevenue,
          totalOrders: totalOrders || 0,
          avgOrderValue: (totalOrders && totalOrders > 0) ? totalRevenue / totalOrders : 0
        });

        // Top sellers by quantity
        const { data: jo } = await supabase
          .from('order_items')
          .select('quantity, price_at_purchase, product:product_id ( seller_id )');
        const sellerMap = {};
        (jo || []).forEach(r => {
          const sid = r.product?.seller_id;
          if (!sid) return;
          if (!sellerMap[sid]) sellerMap[sid] = { quantity: 0, revenue: 0 };
          sellerMap[sid].quantity += (r.quantity || 0);
          sellerMap[sid].revenue += ((r.price_at_purchase || 0) * (r.quantity || 0));
        });
        setTopSellers(Object.entries(sellerMap)
          .map(([id, data]) => ({ id, ...data }))
          .sort((a,b) => b.revenue - a.revenue)
          .slice(0, 5));
      } catch (error) {
        console.error('Error loading analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const maxRevenue = Math.max(...daily.map(([_, rev]) => rev), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Analytics Dashboard
        </h2>
        <p className="text-gray-600 mt-1">Platform performance metrics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="h-8 w-8 text-blue-600" />
            <TrendingUp className="h-5 w-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-blue-900 mb-1">
            ${stats.totalRevenue.toFixed(2)}
          </div>
          <div className="text-sm font-medium text-blue-700">Total Revenue</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <ShoppingCart className="h-8 w-8 text-green-600" />
            <TrendingUp className="h-5 w-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-green-900 mb-1">
            {stats.totalOrders}
          </div>
          <div className="text-sm font-medium text-green-700">Total Orders</div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="h-8 w-8 text-purple-600" />
            <TrendingUp className="h-5 w-5 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-purple-900 mb-1">
            ${stats.avgOrderValue.toFixed(2)}
          </div>
          <div className="text-sm font-medium text-purple-700">Avg Order Value</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales per Day */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Sales per Day (Last 14 Days)
          </h3>
          {daily.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No sales data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {daily.map(([date, revenue]) => {
                const percentage = (revenue / maxRevenue) * 100;
                return (
                  <div key={date}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        ${revenue.toFixed(2)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-purple-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top Sellers */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Store className="h-5 w-5 text-green-600" />
            Top Sellers by Revenue
          </h3>
          {topSellers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Store className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No seller data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topSellers.map((seller, index) => {
                const maxSellerRevenue = Math.max(...topSellers.map(s => s.revenue), 1);
                const percentage = (seller.revenue / maxSellerRevenue) * 100;
                return (
                  <div key={seller.id} className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700 truncate">
                          {seller.id.slice(0, 16)}...
                        </span>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-gray-900 block">
                            ${seller.revenue.toFixed(2)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {seller.quantity} items
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}






