import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const MOD_KEY = 'admin_moderation_flags_v1';

export default function AdminModeration() {
  const [profiles, setProfiles] = useState([]);
  const [flags, setFlags] = useState({}); // { [user_id]: { banned: bool, warning: string } }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(MOD_KEY) || '{}');
      setFlags(saved);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(MOD_KEY, JSON.stringify(flags));
  }, [flags]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('profile')
          .select('user_id,username,full_name,user_type,created_at')
          .order('created_at', { ascending: false });
        setProfiles(data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleBan = (userId) => {
    setFlags((prev) => ({
      ...prev,
      [userId]: { banned: !prev[userId]?.banned, warning: prev[userId]?.warning || '' }
    }));
  };

  const setWarn = (userId, text) => {
    setFlags((prev) => ({
      ...prev,
      [userId]: { banned: !!prev[userId]?.banned, warning: text }
    }));
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Moderation</h2>
      <p className="text-sm text-gray-600 mb-4">Ban or warn users/sellers. Stored locally for now.</p>
      {loading ? 'Loading...' : (
        <div className="overflow-auto border rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left p-3">User</th>
                <th className="text-left p-3">Role</th>
                <th className="text-left p-3">Banned</th>
                <th className="text-left p-3">Warning</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => {
                const f = flags[p.user_id] || {};
                return (
                  <tr key={p.user_id} className="border-t">
                    <td className="p-3">
                      <div className="font-medium">{p.full_name || p.username || p.user_id}</div>
                      <div className="text-gray-500">{p.user_id}</div>
                    </td>
                    <td className="p-3 capitalize">{p.user_type || '—'}</td>
                    <td className="p-3">{f.banned ? 'Yes' : 'No'}</td>
                    <td className="p-3 w-64">
                      <input
                        className="w-full border rounded px-2 py-1"
                        placeholder="Write a warning"
                        value={f.warning || ''}
                        onChange={(e) => setWarn(p.user_id, e.target.value)}
                      />
                    </td>
                    <td className="p-3">
                      <button className={`px-3 py-1 rounded ${f.banned ? 'bg-gray-200' : 'bg-red-50 text-red-700'}`} onClick={() => toggleBan(p.user_id)}>
                        {f.banned ? 'Unban' : 'Ban'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


