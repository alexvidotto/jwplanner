import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export const useWeekByDate = (date: Date) => {
  return useQuery({
    queryKey: ['week', date.toISOString()],
    queryFn: async () => {
      try {
        const { data } = await api.get('/planning/weeks/by-date', { params: { date: date.toISOString() } });
        return data;
      } catch (error: any) {
        if (error.response && error.response.status === 404) return null;
        return null; 
      }
    },
    retry: false, 
  });
};

export const useCreateWeek = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ date }: { date: Date }) => {
      const { data } = await api.post('/planning/weeks', { date: date.toISOString() });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['week', variables.date.toISOString()] });
    },
  });
};

export const useUpdateWeek = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const resp = await api.put(`/planning/weeks/${id}`, data);
      return resp.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['week'] }); 
    },
  });
};

export const useWeeks = () => {
  return useQuery({
    queryKey: ['weeks'],
    queryFn: async () => {
      const { data } = await api.get('/planning/weeks');
      return data;
    },
  });
};

export const useGenerateWeeks = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ month, year }: { month: number; year: number }) => {
      const { data } = await api.post('/planning/weeks/generate', { month, year });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weeks'] });
    },
  });
};
