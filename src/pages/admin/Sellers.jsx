import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Store, Search, UserX, Loader2, Calendar, CheckCircle } from 'lucide-react';

export default function AdminSellers() {
  const [sellers, setSellers] = useState([]);
  const [filteredSellers, setFilteredSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('profile')
        .select('user_id,username,full_name,user_type,created_at')
        .eq('user_type', 'seller')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setSellers(data || []);
      setFilteredSellers(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let filtered = sellers;
    
    if (searchTerm) {
      filtered = filtered.filter(p => 
        (p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         p.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
         p.user_id.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    setFilteredSellers(filtered);
  }, [searchTerm, sellers]);

  const demote = async (row) => {
    if (!confirm(`Are you sure you want to demote ${row.full_name || row.username || 'this seller'} to buyer?`)) {
      return;
    }
    try {
      await supabase.from('profile').update({ user_type: 'buyer' }).eq('user_id', row.user_id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

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
          <Store className="h-6 w-6" />
          Manage Sellers
        </h2>
        <p className="text-gray-600 mt-1">Total sellers: {sellers.length}</p>
        <p className="text-sm text-gray-500 mt-2">
          Note: This page manages existing sellers. Pending seller requests would require additional database setup.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search sellers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member Since</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSellers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    <Store className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>No sellers found</p>
                  </td>
                </tr>
              ) : (
                filteredSellers.map((p) => (
                  <tr key={p.user_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Store className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {p.full_name || p.username || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">{p.user_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3" />
                        Active Seller
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="h-4 w-4" />
                        {new Date(p.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => demote(p)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <UserX className="h-4 w-4" />
                        Demote to Buyer
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


