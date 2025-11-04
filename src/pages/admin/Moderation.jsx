import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Shield, Search, Ban, AlertTriangle, CheckCircle, Loader2, User } from 'lucide-react';

const MOD_KEY = 'admin_moderation_flags_v1';

export default function AdminModeration() {
  const [profiles, setProfiles] = useState([]);
  const [filteredProfiles, setFilteredProfiles] = useState([]);
  const [flags, setFlags] = useState({}); // { [user_id]: { banned: bool, warning: string } }
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, banned, warned

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
        setFilteredProfiles(data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    let filtered = profiles;
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        (p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         p.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         p.user_id.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (filterType === 'banned') {
      filtered = filtered.filter(p => flags[p.user_id]?.banned);
    } else if (filterType === 'warned') {
      filtered = filtered.filter(p => flags[p.user_id]?.warning && !flags[p.user_id]?.banned);
    }
    
    setFilteredProfiles(filtered);
  }, [searchTerm, filterType, profiles, flags]);

  const toggleBan = (userId, userName) => {
    const f = flags[userId];
    const isBanned = f?.banned;
    if (!isBanned && !confirm(`Are you sure you want to ban ${userName || 'this user'}?`)) {
      return;
    }
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

  const getRoleBadgeColor = (role) => {
    const colors = {
      buyer: 'bg-blue-100 text-blue-800',
      seller: 'bg-green-100 text-green-800',
      admin: 'bg-purple-100 text-purple-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const bannedCount = profiles.filter(p => flags[p.user_id]?.banned).length;
  const warnedCount = profiles.filter(p => flags[p.user_id]?.warning && !flags[p.user_id]?.banned).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Moderation
        </h2>
        <p className="text-gray-600 mt-1">Ban or warn users/sellers. Status is stored locally.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Total Users</div>
          <div className="text-2xl font-bold text-gray-900">{profiles.length}</div>
        </div>
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <div className="text-sm text-red-600 mb-1">Banned</div>
          <div className="text-2xl font-bold text-red-700">{bannedCount}</div>
        </div>
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
          <div className="text-sm text-yellow-600 mb-1">Warned</div>
          <div className="text-2xl font-bold text-yellow-700">{warnedCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="all">All Users</option>
          <option value="banned">Banned Only</option>
          <option value="warned">Warned Only</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warning</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <Shield className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No users found</p>
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((p) => {
                  const f = flags[p.user_id] || {};
                  const userName = p.full_name || p.username || 'Unknown';
                  return (
                    <tr key={p.user_id} className={`hover:bg-gray-50 transition-colors ${f.banned ? 'bg-red-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${f.banned ? 'bg-red-100' : 'bg-purple-100'}`}>
                            <User className={`h-5 w-5 ${f.banned ? 'text-red-600' : 'text-purple-600'}`} />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{userName}</div>
                            <div className="text-sm text-gray-500">{p.user_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${getRoleBadgeColor(p.user_type)}`}>
                          {p.user_type || 'buyer'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {f.banned ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            <Ban className="h-3 w-3" />
                            Banned
                          </span>
                        ) : f.warning ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            <AlertTriangle className="h-3 w-3" />
                            Warned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3" />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <input
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Add warning message..."
                          value={f.warning || ''}
                          onChange={(e) => setWarn(p.user_id, e.target.value)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => toggleBan(p.user_id, userName)}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                            f.banned
                              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              : 'bg-red-50 text-red-700 hover:bg-red-100'
                          }`}
                        >
                          {f.banned ? (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              Unban
                            </>
                          ) : (
                            <>
                              <Ban className="h-4 w-4" />
                              Ban
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


