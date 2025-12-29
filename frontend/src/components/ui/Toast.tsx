import { useEffect } from 'react';
import { Check, AlertTriangle } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  isVisible: boolean;
  onClose: () => void;
}

export const Toast = ({ message, type = 'success', isVisible, onClose }: ToastProps) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] min-w-[300px] sm:min-w-[auto] sm:w-auto px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 bg-white text-gray-800 border-l-4 animate-in slide-in-from-top-5 fade-in duration-300 ${type === 'success' ? 'border-emerald-500' : 'border-red-500'}`}>
      {type === 'success' ? <Check size={20} className="text-emerald-500 flex-shrink-0" /> : <AlertTriangle size={20} className="text-red-500 flex-shrink-0" />}
      <span className="font-medium text-sm">{message}</span>
    </div>
  );
};
