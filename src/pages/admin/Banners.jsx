import { useEffect, useState } from 'react';
import { Image as ImageIcon, Plus, Trash2, Power, PowerOff, ExternalLink, Loader2 } from 'lucide-react';

const KEY = 'admin_banners_promotions_v1';

export default function AdminBanners() {
  const [banners, setBanners] = useState([]); // { id, title, imageUrl, link, active }
  const [form, setForm] = useState({ title: '', imageUrl: '', link: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '[]');
      setBanners(saved);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(banners));
  }, [banners]);

  const validateForm = () => {
    const newErrors = {};
    if (!form.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!form.imageUrl.trim()) {
      newErrors.imageUrl = 'Image URL is required';
    } else if (!form.imageUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i) && !form.imageUrl.startsWith('http')) {
      newErrors.imageUrl = 'Please enter a valid image URL';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const add = () => {
    if (!validateForm()) return;
    setBanners([{ id: crypto.randomUUID(), title: form.title.trim(), imageUrl: form.imageUrl.trim(), link: form.link.trim(), active: true }, ...banners]);
    setForm({ title: '', imageUrl: '', link: '' });
    setErrors({});
  };

  const toggle = (id) => setBanners(banners.map(b => b.id === id ? { ...b, active: !b.active } : b));
  const remove = (id) => {
    if (confirm('Are you sure you want to remove this banner?')) {
      setBanners(banners.filter(b => b.id !== id));
    }
  };

  const activeCount = banners.filter(b => b.active).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ImageIcon className="h-6 w-6" />
          Homepage Banners & Promotions
        </h2>
        <p className="text-gray-600 mt-1">Manage promotional banners for the homepage</p>
      </div>

      {/* Stats */}
      <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-purple-600 mb-1">Total Banners</div>
            <div className="text-2xl font-bold text-purple-900">{banners.length}</div>
          </div>
          <div>
            <div className="text-sm text-purple-600 mb-1">Active</div>
            <div className="text-2xl font-bold text-purple-900">{activeCount}</div>
          </div>
        </div>
      </div>

      {/* Add Banner Form */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add New Banner
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.title ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Banner title"
              value={form.title}
              onChange={(e) => {
                setForm({...form, title: e.target.value});
                if (errors.title) setErrors({...errors, title: null});
              }}
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL *</label>
            <input
              className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                errors.imageUrl ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="https://example.com/image.jpg"
              value={form.imageUrl}
              onChange={(e) => {
                setForm({...form, imageUrl: e.target.value});
                if (errors.imageUrl) setErrors({...errors, imageUrl: null});
              }}
            />
            {errors.imageUrl && <p className="mt-1 text-sm text-red-600">{errors.imageUrl}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link URL (optional)</label>
            <input
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="https://example.com"
              value={form.link}
              onChange={(e)=>setForm({...form,link:e.target.value})}
            />
          </div>
          <button
            className="inline-flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
            onClick={add}
          >
            <Plus className="h-4 w-4" />
            Add Banner
          </button>
        </div>
      </div>

      {/* Banners Grid */}
      {banners.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <ImageIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500 text-lg">No banners yet</p>
          <p className="text-gray-400 text-sm mt-2">Add your first promotional banner above</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map(b => (
            <div key={b.id} className={`bg-white rounded-xl border-2 overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md ${
              b.active ? 'border-green-200' : 'border-gray-200 opacity-75'
            }`}>
              <div className="relative">
                {b.imageUrl ? (
                  <img
                    src={b.imageUrl}
                    alt={b.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="200"%3E%3Crect fill="%23f3f4f6" width="400" height="200"/%3E%3Ctext fill="%239ca3af" font-family="sans-serif" font-size="18" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
                    }}
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400">
                    <ImageIcon className="h-12 w-12" />
                  </div>
                )}
                <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold ${
                  b.active ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                }`}>
                  {b.active ? 'Active' : 'Inactive'}
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-semibold text-gray-900 mb-2">{b.title}</h4>
                {b.link && (
                  <a
                    href={b.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 mb-3"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View Link
                  </a>
                )}
                <div className="flex gap-2 mt-4">
                  <button
                    className={`flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                      b.active
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                    onClick={()=>toggle(b.id)}
                  >
                    {b.active ? (
                      <>
                        <PowerOff className="h-4 w-4" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Power className="h-4 w-4" />
                        Activate
                      </>
                    )}
                  </button>
                  <button
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                    onClick={()=>remove(b.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}






