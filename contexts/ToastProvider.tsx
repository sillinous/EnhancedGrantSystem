import React, { createContext, useContext, useState } from 'react';

interface Toast { id: number; message: string; type: 'success' | 'error' | 'info' }
interface ToastContextType { showToast: (message: string, type?: Toast['type']) => void }

export const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = (message: string, type: Toast['type'] = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div style={{ position:'fixed', bottom:20, right:20, zIndex:9999, display:'flex', flexDirection:'column', gap:8 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: t.type==='error'?'#ef4444':'#10b981', color:'#fff', padding:'10px 16px', borderRadius:6, fontSize:13, fontWeight:500, boxShadow:'0 4px 16px rgba(0,0,0,0.3)' }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
