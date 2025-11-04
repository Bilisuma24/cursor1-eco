import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  Users, 
  Store, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp,
  Clock,
  AlertCircle
} from 'lucide-react';

export default function AdminOverview() {
  const [stats, setStats] = useState({ 
    users: 0, 
    sellers: 0, 
    products: 0, 
    orders: 0, 
    revenue: 0,
    recentUsers: [],
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        // Load counts
        const [
          { count: users }, 
          { count: sellers }, 
          { count: products },
          { count: orders },
          { data: orderItems }
        ] = await Promise.all([
          supabase.from('profile').select('*', { count: 'exact', head: true }),
          supabase.from('profile').select('*', { count: 'exact', head: true }).eq('user_type', 'seller'),
          supabase.from('product').select('*', { count: 'exact', head: true }),
          supabase.from('order').select('*', { count: 'exact', head: true }),
          supabase.from('order_items').select('price_at_purchase,quantity')
        ]);

        // Calculate revenue
        const revenue = (orderItems?.data || []).reduce((sum, item) => 
          sum + ((item.price_at_purchase || 0) * (item.quantity || 0)), 0
        );

        // Load recent users
        const { data: recentUsers } = await supabase
          .from('profile')
          .select('user_id,username,full_name,user_type,created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        // Load recent orders
        const { data: recentOrders } = await supabase
          .from('order')
          .select('id,status,total_price,created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        setStats({ 
          users: users || 0, 
          sellers: sellers || 0, 
          products: products || 0,
          orders: orders || 0,
          revenue: revenue || 0,
          recentUsers: recentUsers || [],
          recentOrders: recentOrders || []
        });
      } catch (error) {
        console.error('Error loading overview data:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const statCards = [
    {
      title: 'Total Users',
      value: stats.users,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    {
      title: 'Active Sellers',
      value: stats.sellers,
      icon: Store,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700'
    },
    {
      title: 'Total Products',
      value: stats.products,
      icon: Package,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700'
    },
    {
      title: 'Total Orders',
      value: stats.orders,
      icon: ShoppingCart,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700'
    },
    {
      title: 'Total Revenue',
      value: `$${stats.revenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-700'
    },
    {
      title: 'Growth Rate',
      value: '+12.5%',
      icon: TrendingUp,
      color: 'bg-indigo-500',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700'
    }
  ];

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div 
              key={card.title}
              className={`${card.bgColor} rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <TrendingUp className="h-5 w-5 text-gray-400" />
              </div>
              <div className={`text-3xl font-bold ${card.textColor} mb-1`}>
                {card.value}
              </div>
              <div className="text-sm font-medium text-gray-600">{card.title}</div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Recent Users</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {stats.recentUsers.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No users yet</p>
              </div>
            ) : (
              stats.recentUsers.map((user) => (
                <div key={user.user_id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.full_name || user.username || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {user.user_type || 'buyer'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {stats.recentOrders.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No orders yet</p>
              </div>
            ) : (
              stats.recentOrders.map((order) => (
                <div key={order.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        Order #{order.id.slice(0, 8)}
                      </p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getStatusColor(order.status)}`}>
                        {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Pending'}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${(order.total_price || 0).toFixed(2)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}






