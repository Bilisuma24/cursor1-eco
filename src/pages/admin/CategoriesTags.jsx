import { useEffect, useState } from 'react';

const storageKey = 'admin_categories_tags_v1';

export default function AdminCategoriesTags() {
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [input, setInput] = useState({ category: '', tag: '' });

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      setCategories(saved.categories || ['Electronics','Fashion','Home & Garden','Sports & Outdoors','Health & Beauty']);
      setTags(saved.tags || ['new','sale','featured']);
    } catch {}
  }, []);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ categories, tags }));
  }, [categories, tags]);

  const addCategory = () => {
    const v = input.category.trim();
    if (!v) return;
    if (!categories.includes(v)) setCategories([...categories, v]);
    setInput((s) => ({ ...s, category: '' }));
  };

  const addTag = () => {
    const v = input.tag.trim();
    if (!v) return;
    if (!tags.includes(v)) setTags([...tags, v]);
    setInput((s) => ({ ...s, tag: '' }));
  };

  const remove = (list, setList, item) => setList(list.filter((x) => x !== item));

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Categories & Tags</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Categories</h3>
          <div className="flex gap-2 mb-3">
            <input className="border rounded px-2 py-1 flex-1" value={input.category} onChange={(e)=>setInput({...input,category:e.target.value})} placeholder="Add category" />
            <button className="px-3 py-1 rounded bg-purple-600 text-white" onClick={addCategory}>Add</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <span key={c} className="px-2 py-1 bg-gray-100 rounded inline-flex items-center gap-2">
                {c}
                <button className="text-gray-500" onClick={()=>remove(categories,setCategories,c)}>×</button>
              </span>
            ))}
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-3">Tags</h3>
          <div className="flex gap-2 mb-3">
            <input className="border rounded px-2 py-1 flex-1" value={input.tag} onChange={(e)=>setInput({...input,tag:e.target.value})} placeholder="Add tag" />
            <button className="px-3 py-1 rounded bg-purple-600 text-white" onClick={addTag}>Add</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map(t => (
              <span key={t} className="px-2 py-1 bg-gray-100 rounded inline-flex items-center gap-2">
                {t}
                <button className="text-gray-500" onClick={()=>remove(tags,setTags,t)}>×</button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}



