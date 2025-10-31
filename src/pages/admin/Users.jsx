import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function AdminUsers() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('profile')
        .select('user_id,username,full_name,user_type,created_at');
      if (error) throw error;
      setProfiles(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateRole = async (row, nextRole) => {
    try {
      await supabase.from('profile').update({ user_type: nextRole }).eq('user_id', row.user_id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Manage Users</h2>
      {error && <div className="mb-3 text-red-600">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-auto border rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left p-3">User</th>
                <th className="text-left p-3">Role</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.user_id} className="border-t">
                  <td className="p-3">
                    <div className="font-medium">{p.full_name || p.username || p.user_id}</div>
                    <div className="text-gray-500">{p.user_id}</div>
                  </td>
                  <td className="p-3 capitalize">{p.user_type || '—'}</td>
                  <td className="p-3 flex gap-2">
                    <button className="px-3 py-1 rounded bg-gray-100" onClick={() => updateRole(p, 'buyer')}>Set Buyer</button>
                    <button className="px-3 py-1 rounded bg-gray-100" onClick={() => updateRole(p, 'seller')}>Set Seller</button>
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


