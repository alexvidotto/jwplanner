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
    <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-[70] px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-white animate-in slide-in-from-bottom-5 fade-in duration-300 ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
      {type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
      <span className="font-medium text-sm">{message}</span>
    </div>
  );
};
