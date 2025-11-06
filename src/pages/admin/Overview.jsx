import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { 
  Users, 
  Store, 
  Package, 
  ShoppingCart,
  DollarSign, 
  TrendingUp
} from 'lucide-react';

export default function AdminOverview() {
  const [stats, setStats] = useState({ 
    users: 0, 
    sellers: 0, 
    products: 0, 
    orders: 0, 
    revenue: 0
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

        setStats({ 
          users: users || 0, 
          sellers: sellers || 0, 
          products: products || 0,
          orders: orders || 0,
          revenue: revenue || 0
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div 
              key={card.title}
              className={`${card.bgColor} dark:bg-gray-700/50 rounded-lg sm:rounded-xl p-2 sm:p-2.5 lg:p-3 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-shadow duration-200`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className={`${card.color} p-1 sm:p-1.5 rounded-lg`}>
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-4 lg:w-4 text-white" />
                </div>
                <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400" />
              </div>
              <div className={`text-base sm:text-lg lg:text-xl font-bold ${card.textColor} dark:text-white mb-0.5`}>
                {card.value}
              </div>
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400">{card.title}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}






