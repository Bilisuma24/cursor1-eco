import React, { createContext, useContext, useCallback, useMemo, useState } from 'react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const next = { id, type: toast.type || 'info', title: toast.title, message: toast.message, duration: toast.duration ?? 2500 };
    setToasts((prev) => [...prev, next]);
    if (next.duration > 0) {
      setTimeout(() => remove(id), next.duration);
    }
    return id;
  }, [remove]);

  const api = useMemo(() => ({
    push,
    remove,
  }), [push, remove]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Inline container to avoid wiring everywhere */}
      <div className="fixed bottom-4 right-4 z-[100] space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`glass rounded-xl shadow-xl border p-4 min-w-[240px] max-w-[360px] animate-fade-in-right ${
              t.type === 'success' ? 'border-green-200' : t.type === 'error' ? 'border-red-200' : 'border-gray-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 mt-2 rounded-full ${t.type === 'success' ? 'bg-green-500' : t.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
              <div className="flex-1">
                {t.title && <div className="font-semibold text-gray-900 mb-0.5">{t.title}</div>}
                {t.message && <div className="text-sm text-gray-700">{t.message}</div>}
              </div>
              <button className="text-gray-400 hover:text-gray-600" onClick={() => remove(t.id)}>✕</button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return { push: () => {}, remove: () => {} };
  }
  return ctx;
}






























