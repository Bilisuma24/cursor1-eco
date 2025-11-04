import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function AdminAnalytics() {
  const [daily, setDaily] = useState([]);
  const [topSellers, setTopSellers] = useState([]);
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
        (items || []).forEach(i => {
          const d = new Date(i.created_at).toISOString().split('T')[0];
          if (!byDay[d]) byDay[d] = 0;
          byDay[d] += (i.price_at_purchase || 0) * (i.quantity || 0);
        });
        setDaily(Object.entries(byDay).sort((a,b)=>a[0]>b[0]?1:-1));

        // Top sellers requires a seller reference; approximate by counting order_items joined to product seller_id
        const { data: jo } = await supabase
          .from('order_items')
          .select('quantity, product:product_id ( seller_id )');
        const sellerMap = {};
        (jo || []).forEach(r => {
          const sid = r.product?.seller_id;
          if (!sid) return;
          sellerMap[sid] = (sellerMap[sid] || 0) + (r.quantity || 0);
        });
        setTopSellers(Object.entries(sellerMap).sort((a,b)=>b[1]-a[1]).slice(0,5));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Analytics</h2>
      {loading ? 'Loading...' : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Sales per day</h3>
            <div className="space-y-2">
              {daily.map(([date, revenue]) => (
                <div key={date} className="flex justify-between text-sm">
                  <span>{date}</span>
                  <span>${revenue.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3">Top sellers (by quantity)</h3>
            <div className="space-y-2">
              {topSellers.map(([sellerId, qty]) => (
                <div key={sellerId} className="flex justify-between text-sm">
                  <span className="truncate mr-2">{sellerId}</span>
                  <span>{qty}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}






