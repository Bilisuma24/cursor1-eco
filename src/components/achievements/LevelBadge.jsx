import React from 'react';

export default function LevelBadge({ levelName, badge, className = '' }) {
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-white ${className}`}>
      {badge && (
        <img src={badge} alt={levelName} className="w-6 h-6 object-contain" />
      )}
      <span className="text-sm font-semibold text-gray-800">{levelName || 'Level'}</span>
    </div>
  );
}












