import React from 'react';

export default function AchievementList({ items = [], className = '' }) {
  if (!items.length) return null;
  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 ${className}`}>
      {items.map((a) => (
        <div key={a.code} className="flex items-center gap-3 p-3 border rounded-lg bg-white">
          {a.icon && <img src={a.icon} alt={a.name} className="w-8 h-8" />}
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-800 truncate">{a.name}</div>
            <div className="text-xs text-gray-500 truncate">{a.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}










