import { useEffect, useState } from 'react';

const KEY = 'admin_banners_promotions_v1';

export default function AdminBanners() {
  const [banners, setBanners] = useState([]); // { id, title, imageUrl, link, active }
  const [form, setForm] = useState({ title: '', imageUrl: '', link: '' });

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '[]');
      setBanners(saved);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(banners));
  }, [banners]);

  const add = () => {
    const t = form.title.trim();
    if (!t) return;
    setBanners([{ id: crypto.randomUUID(), title: t, imageUrl: form.imageUrl.trim(), link: form.link.trim(), active: true }, ...banners]);
    setForm({ title: '', imageUrl: '', link: '' });
  };

  const toggle = (id) => setBanners(banners.map(b => b.id === id ? { ...b, active: !b.active } : b));
  const remove = (id) => setBanners(banners.filter(b => b.id !== id));

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Homepage Banners & Promotions</h2>
      <div className="border rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="border rounded px-2 py-1" placeholder="Title" value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} />
          <input className="border rounded px-2 py-1" placeholder="Image URL" value={form.imageUrl} onChange={(e)=>setForm({...form,imageUrl:e.target.value})} />
          <input className="border rounded px-2 py-1" placeholder="Link URL" value={form.link} onChange={(e)=>setForm({...form,link:e.target.value})} />
        </div>
        <div className="mt-3">
          <button className="px-4 py-2 bg-purple-600 text-white rounded" onClick={add}>Add Banner</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {banners.map(b => (
          <div key={b.id} className="border rounded-lg overflow-hidden bg-white">
            {b.imageUrl ? (
              <img src={b.imageUrl} alt={b.title} className="w-full h-32 object-cover" />
            ) : (
              <div className="w-full h-32 bg-gray-100 flex items-center justify-center text-gray-400">No Image</div>
            )}
            <div className="p-3">
              <div className="font-semibold">{b.title}</div>
              {b.link && <a className="text-purple-700 text-sm" href={b.link} target="_blank" rel="noreferrer">{b.link}</a>}
              <div className="mt-2 flex gap-2">
                <button className={`px-3 py-1 rounded ${b.active ? 'bg-gray-100' : 'bg-green-50 text-green-700'}`} onClick={()=>toggle(b.id)}>{b.active ? 'Deactivate' : 'Activate'}</button>
                <button className="px-3 py-1 rounded bg-red-50 text-red-700" onClick={()=>remove(b.id)}>Remove</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}



