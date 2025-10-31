import React from 'react';

export default function CelebrationModal({ open, onClose, achievement }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-md w-full text-center" onClick={(e) => e.stopPropagation()}>
        <div className="text-3xl mb-2">🎉 Congratulations!</div>
        {achievement?.icon && <img src={achievement.icon} alt={achievement.name} className="w-16 h-16 mx-auto mb-2" />}
        <div className="text-lg font-semibold text-gray-900">{achievement?.name || 'New Achievement'}</div>
        <div className="text-sm text-gray-600 mt-1">{achievement?.description}</div>
        <button className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white" onClick={onClose}>Great!</button>
      </div>
    </div>
  );
}



