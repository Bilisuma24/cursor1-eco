import { useEffect, useState } from 'react';
import { Tags, Plus, X, Hash, FolderOpen } from 'lucide-react';

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
    if (categories.includes(v)) {
      alert('This category already exists');
      return;
    }
    setCategories([...categories, v]);
    setInput((s) => ({ ...s, category: '' }));
  };

  const addTag = () => {
    const v = input.tag.trim().toLowerCase();
    if (!v) return;
    if (tags.includes(v)) {
      alert('This tag already exists');
      return;
    }
    setTags([...tags, v]);
    setInput((s) => ({ ...s, tag: '' }));
  };

  const handleKeyPress = (e, type) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (type === 'category') addCategory();
      else addTag();
    }
  };

  const remove = (list, setList, item) => {
    if (confirm(`Are you sure you want to remove "${item}"?`)) {
      setList(list.filter((x) => x !== item));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Tags className="h-6 w-6" />
          Categories & Tags
        </h2>
        <p className="text-gray-600 mt-1">Manage product categories and tags</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categories */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <FolderOpen className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
            <span className="ml-auto px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
              {categories.length}
            </span>
          </div>
          <div className="flex gap-2 mb-4">
            <input
              className="border border-gray-300 rounded-lg px-4 py-2 flex-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={input.category}
              onChange={(e)=>setInput({...input,category:e.target.value})}
              onKeyPress={(e) => handleKeyPress(e, 'category')}
              placeholder="Add a new category..."
            />
            <button
              className="inline-flex items-center gap-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              onClick={addCategory}
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
          {categories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FolderOpen className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No categories yet</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <span
                  key={c}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 font-medium"
                >
                  {c}
                  <button
                    className="hover:bg-purple-200 rounded-full p-0.5 transition-colors"
                    onClick={()=>remove(categories,setCategories,c)}
                    title="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Hash className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Tags</h3>
            <span className="ml-auto px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
              {tags.length}
            </span>
          </div>
          <div className="flex gap-2 mb-4">
            <input
              className="border border-gray-300 rounded-lg px-4 py-2 flex-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={input.tag}
              onChange={(e)=>setInput({...input,tag:e.target.value})}
              onKeyPress={(e) => handleKeyPress(e, 'tag')}
              placeholder="Add a new tag..."
            />
            <button
              className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              onClick={addTag}
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
          {tags.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Hash className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No tags yet</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map(t => (
                <span
                  key={t}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 font-medium"
                >
                  #{t}
                  <button
                    className="hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                    onClick={()=>remove(tags,setTags,t)}
                    title="Remove"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}






