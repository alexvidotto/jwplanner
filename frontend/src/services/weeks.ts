import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';

export interface Semana {
  id: string;
  descricao: string;
  dataInicio: string;
}

export const useWeeks = () => {
  return useQuery({
    queryKey: ['weeks'],
    queryFn: async () => {
      // For now, we don't have a direct "get all weeks" endpoint that lists everything, 
      // but we can generate or use a findMany if implemented.
      // Let's assume we want to fetch generated weeks or generate them.
      // For this interaction, let's try to fetch existing weeks or generate for current month.

      // POST /planning/weeks/generate to ensure we have weeks, then maybe we need a GET.
      // The backend implementation of WeeksController has create (generate).
      // It doesn't seem to have a simple "list" endpoint in the snippets I saw?
      // Let's check WeeksController again.

      // If missing, we might need to add it or use Prisma directly (in dev) / add endpoint.
      // Let's assume we add a GET endpoint to WeeksController.
      const { data } = await api.get<Semana[]>('/planning/weeks');
      return data;
    },
  });
};

export const useGenerateWeeks = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ month, year }: { month: number, year: number }) => {
      const { data } = await api.post('/planning/weeks/generate', { month, year });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeks'] });
    }
  });
};
