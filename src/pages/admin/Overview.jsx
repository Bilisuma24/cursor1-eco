import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function AdminOverview() {
  const [stats, setStats] = useState({ users: 0, sellers: 0, products: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [{ count: users }, { count: sellers }, { count: products }] = await Promise.all([
          supabase.from('profile').select('*', { count: 'exact', head: true }),
          supabase.from('profile').select('*', { count: 'exact', head: true }).eq('user_type', 'seller'),
          supabase.from('product').select('*', { count: 'exact', head: true })
        ]);
        setStats({ users: users || 0, sellers: sellers || 0, products: products || 0 });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Overview</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border bg-gray-50">
            <div className="text-sm text-gray-500">Users</div>
            <div className="text-2xl font-bold">{stats.users}</div>
          </div>
          <div className="p-4 rounded-lg border bg-gray-50">
            <div className="text-sm text-gray-500">Sellers</div>
            <div className="text-2xl font-bold">{stats.sellers}</div>
          </div>
          <div className="p-4 rounded-lg border bg-gray-50">
            <div className="text-sm text-gray-500">Products</div>
            <div className="text-2xl font-bold">{stats.products}</div>
          </div>
        </div>
      )}
    </div>
  );
}






