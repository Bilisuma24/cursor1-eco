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
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Shield className="h-5 w-5 sm:h-6 sm:w-6" />
          Moderation
        </h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">Ban or warn users/sellers. Status is stored locally.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Total Users</div>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{profiles.length}</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-red-600 dark:text-red-400 mb-1">Banned</div>
          <div className="text-xl sm:text-2xl font-bold text-red-700 dark:text-red-400">{bannedCount}</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-yellow-600 dark:text-yellow-400 mb-1">Warned</div>
          <div className="text-xl sm:text-2xl font-bold text-yellow-700 dark:text-yellow-400">{warnedCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="all">All Users</option>
          <option value="banned">Banned Only</option>
          <option value="warned">Warned Only</option>
        </select>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Warning</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <Shield className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No users found</p>
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((p) => {
                  const f = flags[p.user_id] || {};
                  const userName = p.full_name || p.username || 'Unknown';
                  return (
                    <tr key={p.user_id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${f.banned ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${f.banned ? 'bg-red-100 dark:bg-red-900/30' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
                            <User className={`h-5 w-5 ${f.banned ? 'text-red-600 dark:text-red-400' : 'text-purple-600 dark:text-purple-400'}`} />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{userName}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{p.user_id}</div>
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
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                            <Ban className="h-3 w-3" />
                            Banned
                          </span>
                        ) : f.warning ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                            <AlertTriangle className="h-3 w-3" />
                            Warned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                            <CheckCircle className="h-3 w-3" />
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <input
                          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="Add warning message..."
                          value={f.warning || ''}
                          onChange={(e) => setWarn(p.user_id, e.target.value)}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => toggleBan(p.user_id, userName)}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg transition-colors text-xs sm:text-sm ${
                            f.banned
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
                          }`}
                        >
                          {f.banned ? (
                            <>
                              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                              Unban
                            </>
                          ) : (
                            <>
                              <Ban className="h-3 w-3 sm:h-4 sm:w-4" />
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

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {filteredProfiles.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
            <Shield className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No users found</p>
          </div>
        ) : (
          filteredProfiles.map((p) => {
            const f = flags[p.user_id] || {};
            const userName = p.full_name || p.username || 'Unknown';
            return (
              <div key={p.user_id} className={`bg-white dark:bg-gray-800 rounded-lg border ${f.banned ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700'} p-4 shadow-sm`}>
                <div className="flex items-start gap-3 mb-3">
                  <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${f.banned ? 'bg-red-100 dark:bg-red-900/30' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
                    <User className={`h-5 w-5 ${f.banned ? 'text-red-600 dark:text-red-400' : 'text-purple-600 dark:text-purple-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate mb-1">
                      {userName}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate mb-2">{p.user_id}</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${getRoleBadgeColor(p.user_type)}`}>
                        {p.user_type || 'buyer'}
                      </span>
                      {f.banned ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                          <Ban className="h-3 w-3" />
                          Banned
                        </span>
                      ) : f.warning ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300">
                          <AlertTriangle className="h-3 w-3" />
                          Warned
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <input
                    className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Add warning message..."
                    value={f.warning || ''}
                    onChange={(e) => setWarn(p.user_id, e.target.value)}
                  />
                  <button
                    onClick={() => toggleBan(p.user_id, userName)}
                    className={`w-full inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors text-xs ${
                      f.banned
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30'
                    }`}
                  >
                    {f.banned ? (
                      <>
                        <CheckCircle className="h-3 w-3" />
                        Unban
                      </>
                    ) : (
                      <>
                        <Ban className="h-3 w-3" />
                        Ban
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


