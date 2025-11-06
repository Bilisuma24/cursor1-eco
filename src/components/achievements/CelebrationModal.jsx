import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export default function CelebrationModal({ open, onClose, achievement }) {
  const [mounted, setMounted] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const modalRef = useRef(null);
  
  // Swipe gesture handlers
  const minSwipeDistance = 50;
  
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };
  
  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchEnd - touchStart;
    if (distance > minSwipeDistance && open) {
      onClose();
    }
  };

  useEffect(() => {
    if (open) {
      setMounted(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setTimeout(() => setMounted(false), 300);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm mobile-modal-backdrop sm:flex sm:items-center sm:justify-center sm:p-4" 
      onClick={onClose}
    >
      <div 
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl p-6 sm:p-8 shadow-2xl max-w-md w-full text-center bottom-sheet animate-bottom-sheet-up absolute bottom-0 left-0 right-0 sm:relative sm:bottom-auto sm:left-auto sm:right-auto"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
        }}
      >
        {/* Swipe indicator */}
        <div className="flex justify-center pt-2 pb-4 sm:hidden">
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full bottom-sheet-handle"></div>
        </div>
        
        <div className="text-4xl sm:text-5xl mb-4">🎉</div>
        <div className="text-2xl sm:text-3xl font-bold mb-2 text-gray-900 dark:text-white">Congratulations!</div>
        {achievement?.icon && (
          <img 
            src={achievement.icon} 
            alt={achievement.name} 
            className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4" 
          />
        )}
        <div className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          {achievement?.name || 'New Achievement'}
        </div>
        <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-2 mb-6">
          {achievement?.description}
        </div>
        <button 
          className="min-h-[48px] w-full px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base transition-colors touch-manipulation active:scale-95 shadow-lg" 
          onClick={onClose}
        >
          Great!
        </button>
      </div>
    </div>,
    document.body
  );
}








