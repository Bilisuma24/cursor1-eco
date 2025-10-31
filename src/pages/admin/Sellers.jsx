import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function AdminSellers() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('profile')
        .select('user_id,username,full_name,user_type,created_at')
        .eq('user_type', 'seller');
      if (error) throw error;
      setSellers(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const demote = async (row) => {
    try {
      await supabase.from('profile').update({ user_type: 'buyer' }).eq('user_id', row.user_id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Approve/Reject Sellers</h2>
      <p className="text-sm text-gray-600 mb-4">Note: Pending seller requests require a DB table. This page manages existing sellers for now.</p>
      {error && <div className="mb-3 text-red-600">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-auto border rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left p-3">Seller</th>
                <th className="text-left p-3">Since</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sellers.map((p) => (
                <tr key={p.user_id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{p.full_name || p.username || p.user_id}</div>
                    <div className="text-gray-500">{p.user_id}</div>
                  </td>
                  <td className="p-3">{new Date(p.created_at).toLocaleDateString()}</td>
                  <td className="p-3 flex gap-2">
                    <button className="px-3 py-1 rounded bg-gray-100" onClick={() => demote(p)}>Reject (Demote)</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


