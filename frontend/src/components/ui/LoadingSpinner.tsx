import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = () => {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const isLoading = isFetching > 0 || isMutating > 0;

  if (!isLoading) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 duration-200 pointer-events-none">
      <div className="bg-white/90 backdrop-blur-md shadow-lg border border-gray-100 rounded-full px-4 py-3 flex items-center gap-3">
        <Loader2 size={18} className="text-blue-600 animate-spin" />
        <span className="text-sm font-medium text-gray-600 pr-2">Sincronizando...</span>
      </div>
    </div>
  );
};
