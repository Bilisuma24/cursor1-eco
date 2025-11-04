import { useEffect, useState } from 'react';
import { productService } from '../../services/productService';
import { supabase } from '../../lib/supabaseClient';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('product')
        .select('id,name,price,category,seller_id,created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    try {
      await productService.deleteProduct(id);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Manage Products</h2>
      {error && <div className="mb-3 text-red-600">{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="overflow-auto border rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Category</th>
                <th className="text-left p-3">Price</th>
                <th className="text-left p-3">Seller</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-3">{p.name}</td>
                  <td className="p-3">{p.category || '—'}</td>
                  <td className="p-3">${p.price?.toFixed?.(2) ?? p.price}</td>
                  <td className="p-3 text-xs">{p.seller_id}</td>
                  <td className="p-3">
                    <button className="px-3 py-1 rounded bg-red-50 text-red-700" onClick={() => remove(p.id)}>Delete</button>
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






