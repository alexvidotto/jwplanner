
import { Button } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar' }: ConfirmModalProps) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 space-y-4">
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="text-gray-600">{message}</p>
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>{cancelLabel}</Button>
          <Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
};
