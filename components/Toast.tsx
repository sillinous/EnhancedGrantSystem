import React, { useContext } from 'react';
import { ToastContext } from '../contexts/ToastProvider';
import { ToastMessage } from '../types';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const icons = {
  success: <CheckCircle className="text-green-500" />,
  error: <AlertCircle className="text-red-500" />,
  info: <Info className="text-blue-500" />,
};

const Toast: React.FC<{ toast: ToastMessage; onDismiss: (id: number) => void }> = ({ toast, onDismiss }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-4 flex items-start gap-3 w-full max-w-sm animate-slide-in-up border border-gray-200">
      <div className="flex-shrink-0 pt-0.5">{icons[toast.type]}</div>
      <div className="flex-grow text-sm text-gray-700">{toast.message}</div>
      <button 
        onClick={() => onDismiss(toast.id)} 
        className="p-1 -m-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        aria-label="Dismiss notification"
      >
        <X size={18} />
      </button>
    </div>
  );
};

const ToastContainer: React.FC = () => {
    const context = useContext(ToastContext);

    if (!context) {
        // This should not happen if the app is wrapped in ToastProvider
        return null;
    }

    const { toasts, removeToast } = context;

    return (
        <div className="fixed top-20 right-4 z-[100] space-y-2">
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} onDismiss={removeToast} />
            ))}
        </div>
    );
};

export default ToastContainer;
