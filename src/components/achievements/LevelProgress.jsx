import React from 'react';

export default function LevelProgress({ xp = 0, next = 100, className = '' }) {
  const pct = Math.min(100, Math.max(0, next ? Math.round((xp / next) * 100) : 0));
  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between text-xs text-gray-600 mb-1">
        <span>XP {xp}</span>
        <span>Next {next}</span>
      </div>
      <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
















